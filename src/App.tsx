/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { SendLocationPanel } from './components/SendLocationPanel';
import { FriendListDrawer } from './components/FriendListDrawer';
import { SettingsModal } from './components/SettingsModal';
import { GitHubPagesModal } from './components/GitHubPagesModal';
import { LoginPage } from './components/LoginPage';
import {
  LocationRecord,
  UserTrail,
  DatabaseConfig,
  GeolocationState,
  AuthUser,
} from './types';
import {
  getSavedDbConfig,
  saveDbConfig,
  sendLocationRecord,
  subscribeToLocations,
  getLocalFallbackRecords,
  clearLocalFallbackRecords,
  getStoredAuthUser,
  saveStoredAuthUser,
  updateStoredNickname,
  signOutUser,
  subscribeToAuthState,
  subscribeToUserSession,
} from './services/firebaseService';
import { buildUserTrails } from './utils/trails';
import { getOrCreateUUID, formatDateTime } from './utils/colors';
import { AlertCircle, CheckCircle, Navigation, Sparkles } from 'lucide-react';

export default function App() {
  // 1. Auth & User Identity States
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const [uuid] = useState<string>(() => getOrCreateUUID());
  const [nickname, setNickname] = useState<string>(() => {
    const storedAuth = getStoredAuthUser();
    if (storedAuth?.nickname) return storedAuth.nickname;
    return localStorage.getItem('trippal_nickname') || '';
  });

  // 2. Geolocation State
  const [currentLocation, setCurrentLocation] = useState<GeolocationState>({
    coords: null,
    error: null,
    isLocating: true,
    lastUpdated: null,
  });

  // 3. Database & Records States
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>(() => getSavedDbConfig());
  const [rawRecords, setRawRecords] = useState<LocationRecord[]>([]);
  const [isRealtime, setIsRealtime] = useState<boolean>(true);
  const [dbConnected, setDbConnected] = useState<boolean>(true);

  // 4. Action States & Map Centering
  const [isSending, setIsSending] = useState<boolean>(false);
  const [lastSentTime, setLastSentTime] = useState<number | null>(null);
  const [autoSendInterval, setAutoSendInterval] = useState<number>(0); // 0 = manual, 60 = 1m, 300 = 5m, 600 = 10m
  const [autoSendCount, setAutoSendCount] = useState<number>(0); // auto-send count, max 6
  const [mapCenterCoords, setMapCenterCoords] = useState<{
    latitude: number;
    longitude: number;
    trigger: number;
  } | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [kickedOutMessage, setKickedOutMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  // Refresh current time every 30 seconds so records older than 1 hour dynamically expire
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // 5. Modals States
  const [isFriendsOpen, setIsFriendsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState<boolean>(false);

  const autoSendTimerRef = useRef<number | null>(null);

  // Show auto-expiring toast
  const showToast = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToastMessage({ text, type });
      setTimeout(() => {
        setToastMessage((prev) => (prev?.text === text ? null : prev));
      }, 4000);
    },
    []
  );

  // Handle successful login
  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    setNickname(user.nickname);
    setKickedOutMessage(null);
    showToast(`歡迎回來，${user.nickname}！`, 'success');
  };

  // Handle Logout
  const handleLogout = async () => {
    await signOutUser();
    setAuthUser(null);
    setKickedOutMessage(null);
    showToast('已安全登出', 'info');
  };

  // Enforce single-session: kick out this device if another device logs into the same account
  useEffect(() => {
    if (!authUser?.email || !authUser?.sessionId) return;

    const unsub = subscribeToUserSession(
      authUser.email,
      authUser.sessionId,
      () => {
        signOutUser();
        setAuthUser(null);
        setKickedOutMessage('此帳號已在其他裝置登入，系統已將您登出。');
      },
      dbConfig
    );

    return () => unsub();
  }, [authUser?.email, authUser?.sessionId, dbConfig]);

  // Save nickname to localStorage & update profile
  const handleNicknameChange = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setNickname(trimmed);
    updateStoredNickname(trimmed);
    if (authUser) {
      localStorage.setItem(`trippal_nick_${authUser.uid}`, trimmed);
      setAuthUser((prev) => (prev ? { ...prev, nickname: trimmed } : null));
    }
    showToast(`暱稱已更新為「${trimmed}」`, 'success');
  };

  // Subscribe to Auth state changes on mount
  useEffect(() => {
    const unsub = subscribeToAuthState((user) => {
      if (user) {
        setAuthUser(user);
        if (!nickname) {
          setNickname(user.nickname);
        }
      }
    }, dbConfig);

    return () => unsub();
  }, [dbConfig]);

  // Obtain GPS Location (HTML5 Geolocation API) with fresh maximumAge:0 & fallback
  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setCurrentLocation((prev) => ({
        ...prev,
        isLocating: false,
        error: '按右鍵 重新尋找GPS',
      }));
      showToast('您的瀏覽器不支援 GPS 地理定位', 'error');
      return;
    }

    setCurrentLocation((prev) => ({ ...prev, isLocating: true, error: null }));

    // Strategy 1: High Accuracy GPS (hardware fix)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
        };
        setCurrentLocation({
          coords,
          error: null,
          isLocating: false,
          lastUpdated: Date.now(),
        });
        setMapCenterCoords({
          latitude: coords.latitude,
          longitude: coords.longitude,
          trigger: Date.now(),
        });
        showToast(`已取得最新 GPS 定位！(精度 ±${Math.round(coords.accuracy || 0)}m)`, 'success');
      },
      (error) => {
        console.warn('High accuracy GPS error, trying network fallback:', error.message);
        // Strategy 2: Network / Cell Assisted Geolocation fallback
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              speed: pos.coords.speed,
              heading: pos.coords.heading,
            };
            setCurrentLocation({
              coords,
              error: null,
              isLocating: false,
              lastUpdated: Date.now(),
            });
            setMapCenterCoords({
              latitude: coords.latitude,
              longitude: coords.longitude,
              trigger: Date.now(),
            });
            showToast(`已取得最新定位 (網路輔助)！`, 'success');
          },
          (err2) => {
            console.warn('Geolocation fallback error:', err2.message);
            setCurrentLocation((prev) => ({
              coords: prev.coords || {
                latitude: 25.0339,
                longitude: 121.5644,
                accuracy: 60,
                speed: null,
                heading: null,
              },
              error: '按右鍵 重新尋找GPS',
              isLocating: false,
              lastUpdated: Date.now(),
            }));
            showToast('GPS 定位失敗，請確認瀏覽器已開啟定位權限，或在地圖上按右鍵重試', 'error');
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Force fresh query, do NOT use stale cache
      }
    );
  }, [showToast]);

  // Continuous Geolocation Watch
  useEffect(() => {
    if (!authUser) return;

    refreshLocation();

    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentLocation({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
          },
          error: null,
          isLocating: false,
          lastUpdated: Date.now(),
        });
      },
      (err) => {
        console.warn('WatchPosition notice:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [refreshLocation, authUser]);

  // Subscribe to Firebase Realtime Database
  useEffect(() => {
    if (!authUser) return;

    const unsubscribe = subscribeToLocations(
      (records, realtime) => {
        setRawRecords(records);
        setIsRealtime(realtime);
        setDbConnected(true);
      },
      (error) => {
        console.warn('Firebase sync warning:', error);
        setDbConnected(false);
      },
      dbConfig
    );

    return () => {
      unsubscribe();
    };
  }, [dbConfig, authUser]);

  // Handle Send Location to Firebase & Center Map on the new point
  const handleSendLocation = async () => {
    const currentNick = nickname.trim() || (authUser?.nickname || '我的暱稱');

    let lat = currentLocation.coords?.latitude;
    let lng = currentLocation.coords?.longitude;
    let accuracy = currentLocation.coords?.accuracy;

    if (!lat || !lng) {
      try {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              accuracy = pos.coords.accuracy;
              setCurrentLocation({
                coords: {
                  latitude: lat,
                  longitude: lng,
                  accuracy,
                  speed: pos.coords.speed,
                  heading: pos.coords.heading,
                },
                error: null,
                isLocating: false,
                lastUpdated: Date.now(),
              });
              resolve();
            },
            (err) => {
              reject(err);
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        });
      } catch (e) {
        lat = 25.0339;
        lng = 121.5644;
      }
    }

    setIsSending(true);
    const now = Date.now();
    const formatted = formatDateTime(now);

    const record: LocationRecord = {
      id: `loc_${now}_${Math.random().toString(36).substring(2, 7)}`,
      uuid: authUser?.uid || uuid,
      nickname: currentNick,
      timestamp: now,
      formattedTime: formatted,
      latitude: lat!,
      longitude: lng!,
      accuracy: accuracy || 15,
      speed: currentLocation.coords?.speed || null,
      heading: currentLocation.coords?.heading || null,
    };

    const res = await sendLocationRecord(record, dbConfig);
    setIsSending(false);

    if (res.success) {
      setLastSentTime(now);
      // Center map on the newly transmitted location
      setMapCenterCoords({
        latitude: lat!,
        longitude: lng!,
        trigger: now,
      });

      showToast(`已成功傳送位置！地圖已移至最新座標 (${currentNick})`, 'success');

      // Optimistically insert to local view if not already included
      setRawRecords((prev) => {
        if (prev.some((r) => r.id === res.id)) return prev;
        return [...prev, record];
      });
    } else {
      showToast(res.error || '傳送失敗，已暫存至本地', 'error');
    }
  };

  // Change Auto-send interval & reset count
  const handleAutoSendIntervalChange = (sec: number) => {
    setAutoSendInterval(sec);
    setAutoSendCount(0);
    if (sec > 0) {
      showToast(`已啟用自動傳送 (每 ${sec / 60} 分鐘，上限 6 筆)`, 'info');
    } else {
      showToast('已切換為手動傳送模式', 'info');
    }
  };

  // Reset Auto-send limit to continue
  const handleResetAutoSendLimit = () => {
    setAutoSendCount(0);
    showToast('已重設自動傳送計數，繼續自動傳送', 'info');
  };

  // Auto-send timer mechanism (Limits to max 6 records)
  useEffect(() => {
    if (autoSendTimerRef.current) {
      clearInterval(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }

    if (autoSendInterval > 0 && nickname.trim() && authUser) {
      autoSendTimerRef.current = window.setInterval(() => {
        setAutoSendCount((prevCount) => {
          if (prevCount >= 6) {
            // Pause auto sending when 6 records reached
            setAutoSendInterval(0);
            showToast('已達到自動傳送 6 筆上限（以降低負載）。請點擊傳送或重新開啟自動傳送。', 'info');
            return prevCount;
          }
          handleSendLocation();
          return prevCount + 1;
        });
      }, autoSendInterval * 1000);
    }

    return () => {
      if (autoSendTimerRef.current) {
        clearInterval(autoSendTimerRef.current);
        autoSendTimerRef.current = null;
      }
    };
  }, [autoSendInterval, nickname, currentLocation.coords, uuid, dbConfig, authUser]);

  // Generate Demo Friends (Alice & Bob, each with 3 sequential locations)
  const handleAddDemoFriends = () => {
    const centerLat = currentLocation.coords?.latitude || 25.033;
    const centerLng = currentLocation.coords?.longitude || 121.565;
    const now = Date.now();

    // Friend 1: 小萱 (3 points moving east)
    const recordsFriend1: LocationRecord[] = [
      {
        id: `demo_1_${now - 120000}`,
        uuid: 'demo-uuid-hsuan',
        nickname: '小萱 (測試好友)',
        timestamp: now - 120000,
        formattedTime: formatDateTime(now - 120000),
        latitude: centerLat + 0.0035,
        longitude: centerLng - 0.004,
        accuracy: 10,
      },
      {
        id: `demo_1_${now - 60000}`,
        uuid: 'demo-uuid-hsuan',
        nickname: '小萱 (測試好友)',
        timestamp: now - 60000,
        formattedTime: formatDateTime(now - 60000),
        latitude: centerLat + 0.002,
        longitude: centerLng - 0.0015,
        accuracy: 8,
      },
      {
        id: `demo_1_${now}`,
        uuid: 'demo-uuid-hsuan',
        nickname: '小萱 (測試好友)',
        timestamp: now,
        formattedTime: formatDateTime(now),
        latitude: centerLat + 0.001,
        longitude: centerLng + 0.002,
        accuracy: 6,
      },
    ];

    // Friend 2: 阿凱 (3 points moving south)
    const recordsFriend2: LocationRecord[] = [
      {
        id: `demo_2_${now - 150000}`,
        uuid: 'demo-uuid-kai',
        nickname: '阿凱 (測試好友)',
        timestamp: now - 150000,
        formattedTime: formatDateTime(now - 150000),
        latitude: centerLat - 0.001,
        longitude: centerLng - 0.003,
        accuracy: 12,
      },
      {
        id: `demo_2_${now - 80000}`,
        uuid: 'demo-uuid-kai',
        nickname: '阿凱 (測試好友)',
        timestamp: now - 80000,
        formattedTime: formatDateTime(now - 80000),
        latitude: centerLat - 0.0025,
        longitude: centerLng - 0.001,
        accuracy: 9,
      },
      {
        id: `demo_2_${now - 10000}`,
        uuid: 'demo-uuid-kai',
        nickname: '阿凱 (測試好友)',
        timestamp: now - 10000,
        formattedTime: formatDateTime(now - 10000),
        latitude: centerLat - 0.004,
        longitude: centerLng + 0.0015,
        accuracy: 5,
      },
    ];

    const combinedDemo = [...recordsFriend1, ...recordsFriend2];

    // Add to records state
    setRawRecords((prev) => {
      const filtered = prev.filter(
        (r) => r.nickname !== '小萱 (測試好友)' && r.nickname !== '阿凱 (測試好友)'
      );
      return [...filtered, ...combinedDemo];
    });

    // Also push to Firebase so other connected users can see if online
    combinedDemo.forEach((rec) => {
      sendLocationRecord(rec, dbConfig);
    });

    showToast('已產生 2 位好友各 3 筆測試軌跡，地圖已自動繪製連線！', 'success');
  };

  // Clear local storage fallback cache
  const handleClearLocalCache = () => {
    clearLocalFallbackRecords();
    setRawRecords([]);
  };

  // Save new database config
  const handleSaveDbConfig = (cfg: DatabaseConfig) => {
    saveDbConfig(cfg);
    setDbConfig(cfg);
    showToast('Firebase 資料庫設定已更新！', 'success');
  };

  // Convert raw records into grouped trails (Last 3 per nickname within the last 1 hour, polyline connected)
  const userTrails: UserTrail[] = buildUserTrails(rawRecords, currentTime);

  // If user is not logged in, render the Login Page
  if (!authUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        dbConfig={dbConfig}
        kickedOutMessage={kickedOutMessage}
      />
    );
  }

  return (
    <div
      className="flex flex-col w-screen h-screen overflow-hidden bg-[#2d5a27] text-slate-100 font-sans"
      onContextMenu={(e) => {
        // Global right click triggers location refresh if desired
        if ((e.target as HTMLElement)?.closest('#leaflet-map-container')) {
          e.preventDefault();
          refreshLocation();
        }
      }}
    >
      {/* Top App Header with TripPal branding, Account email, and Editable nickname */}
      <Header
        onlineCount={userTrails.length}
        authUser={authUser}
        nickname={nickname}
        onNicknameChange={handleNicknameChange}
        onLogout={handleLogout}
        onOpenFriends={() => setIsFriendsOpen(true)}
      />

      {/* GPS Warning Banner if permission denied */}
      {currentLocation.error && (
        <div
          className="px-4 py-2 bg-amber-950/85 border-b border-amber-600/60 text-amber-200 text-xs flex items-center justify-between z-20 backdrop-blur-md cursor-pointer"
          onClick={refreshLocation}
          onContextMenu={(e) => {
            e.preventDefault();
            refreshLocation();
          }}
          title="按右鍵或點擊以重新尋找 GPS"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-medium">按右鍵 重新尋找GPS</span>
          </div>
          <button
            id="btn-retry-location-banner"
            onClick={(e) => {
              e.stopPropagation();
              refreshLocation();
            }}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-[11px] font-bold shrink-0 transition-colors shadow-xs"
          >
            重新取得定位
          </button>
        </div>
      )}

      {/* Main Map View Area */}
      <main className="flex-1 min-h-0 relative w-full h-full overflow-hidden">
        <MapView
          trails={userTrails}
          currentLocation={currentLocation}
          myNickname={nickname}
          selectedUserId={selectedUser}
          centerCoords={mapCenterCoords}
          onSelectUser={(nick) => setSelectedUser(nick)}
          onLocateMeRequest={refreshLocation}
        />
      </main>

      {/* Bottom Send Location & Nickname Panel with Friend Distances */}
      <SendLocationPanel
        nickname={nickname}
        onNicknameChange={handleNicknameChange}
        uuid={authUser.uid || uuid}
        currentLocation={currentLocation}
        onSendLocation={handleSendLocation}
        isSending={isSending}
        lastSentTime={lastSentTime}
        autoSendInterval={autoSendInterval}
        onAutoSendIntervalChange={handleAutoSendIntervalChange}
        autoSendCount={autoSendCount}
        maxAutoSendCount={6}
        onResetAutoSendLimit={handleResetAutoSendLimit}
        onRefreshLocation={refreshLocation}
        trails={userTrails}
        onSelectUser={(nick) => setSelectedUser(nick)}
        selectedUserId={selectedUser}
        onAddDemoFriends={handleAddDemoFriends}
      />

      {/* Floating Toast Alerts */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-none">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 border backdrop-blur-xl pointer-events-auto ${
              toastMessage.type === 'success'
                ? 'bg-[#183315]/95 text-emerald-100 border-emerald-400 shadow-black/50'
                : toastMessage.type === 'error'
                ? 'bg-red-950/95 text-red-100 border-red-500 shadow-black/50'
                : 'bg-[#1b3b17]/95 text-white border-emerald-500/60 shadow-black/50'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Friends List Drawer */}
      <FriendListDrawer
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        trails={userTrails}
        currentLocation={currentLocation}
        onSelectUser={(nick) => {
          setSelectedUser(nick);
          setIsFriendsOpen(false);
        }}
      />

      {/* Database Settings Modal (Firebase trippal-70d7d) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={dbConfig}
        onSaveConfig={handleSaveDbConfig}
        onAddDemoFriends={handleAddDemoFriends}
        onClearLocalCache={handleClearLocalCache}
      />

      {/* GitHub Pages Deployment & Share Guide Modal */}
      <GitHubPagesModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
      />
    </div>
  );
}
