/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PixelAvatarProps {
  id: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PixelAvatar: React.FC<PixelAvatarProps> = ({ id, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }[size];

  // Pixel-art portraits rendered as crisp SVG vectors with retro palettes
  const renderSvgPortrait = () => {
    switch (id) {
      case 'hrushevsky':
        // Михайло Грушевський: Scholar, full white/grey beard, round glasses, dark suit, papakha/tie
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full [image-rendering:pixelated]" shapeRendering="crispEdges">
            {/* Background */}
            <rect width="32" height="32" fill="#2d261e" />
            {/* Shoulders / Coat */}
            <rect x="4" y="24" width="24" height="8" fill="#1c1917" />
            <rect x="12" y="24" width="8" height="4" fill="#f8fafc" />
            <rect x="14" y="26" width="4" height="6" fill="#0369a1" />
            {/* Head / Neck */}
            <rect x="10" y="8" width="12" height="15" fill="#fbd5b5" />
            {/* Hair */}
            <rect x="8" y="6" width="16" height="5" fill="#94a3b8" />
            <rect x="7" y="9" width="4" height="7" fill="#cbd5e1" />
            <rect x="21" y="9" width="4" height="7" fill="#cbd5e1" />
            {/* Forehead & Spectacles */}
            <rect x="11" y="12" width="4" height="3" fill="#334155" />
            <rect x="17" y="12" width="4" height="3" fill="#334155" />
            <rect x="15" y="13" width="2" height="1" fill="#334155" />
            <rect x="12" y="13" width="2" height="1" fill="#93c5fd" />
            <rect x="18" y="13" width="2" height="1" fill="#93c5fd" />
            {/* Eyes */}
            <rect x="12" y="13" width="1" height="1" fill="#0f172a" />
            <rect x="18" y="13" width="1" height="1" fill="#0f172a" />
            {/* Nose */}
            <rect x="15" y="14" width="2" height="3" fill="#e0a980" />
            {/* Magnificent Beard */}
            <rect x="10" y="17" width="12" height="7" fill="#e2e8f0" />
            <rect x="11" y="20" width="10" height="6" fill="#f8fafc" />
            <rect x="12" y="24" width="8" height="3" fill="#cbd5e1" />
            <rect x="13" y="17" width="6" height="2" fill="#cbd5e1" />
          </svg>
        );

      case 'vynnychenko':
        // Володимир Винниченко: Stylish dark hair, sharp gaze, mustache, bohemian scarf
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full [image-rendering:pixelated]" shapeRendering="crispEdges">
            <rect width="32" height="32" fill="#261c1c" />
            {/* Coat */}
            <rect x="4" y="23" width="24" height="9" fill="#292524" />
            <rect x="13" y="23" width="6" height="9" fill="#991b1b" />
            {/* Face */}
            <rect x="10" y="9" width="12" height="14" fill="#fbd5b5" />
            {/* Dark hair styled backward */}
            <rect x="8" y="5" width="16" height="6" fill="#18181b" />
            <rect x="8" y="9" width="3" height="7" fill="#18181b" />
            <rect x="21" y="9" width="3" height="7" fill="#18181b" />
            {/* Brows and Eyes */}
            <rect x="11" y="12" width="3" height="1" fill="#18181b" />
            <rect x="18" y="12" width="3" height="1" fill="#18181b" />
            <rect x="12" y="13" width="2" height="2" fill="#27272a" />
            <rect x="18" y="13" width="2" height="2" fill="#27272a" />
            {/* Nose */}
            <rect x="15" y="14" width="2" height="3" fill="#e0a980" />
            {/* Characteristic Mustache */}
            <rect x="12" y="17" width="8" height="2" fill="#18181b" />
            <rect x="11" y="18" width="2" height="2" fill="#18181b" />
            <rect x="19" y="18" width="2" height="2" fill="#18181b" />
            {/* Chin */}
            <rect x="14" y="20" width="4" height="2" fill="#e0a980" />
          </svg>
        );

      case 'mikhnovsky':
        // Микола Міхновський: High forehead, resolute expression, thick Ukrainian mustache
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full [image-rendering:pixelated]" shapeRendering="crispEdges">
            <rect width="32" height="32" fill="#1e2229" />
            {/* Suit */}
            <rect x="4" y="24" width="24" height="8" fill="#1e293b" />
            <rect x="13" y="24" width="6" height="8" fill="#f8fafc" />
            <rect x="15" y="25" width="2" height="7" fill="#0284c7" />
            {/* Head */}
            <rect x="10" y="8" width="12" height="15" fill="#fcd9b8" />
            {/* High forehead / receding dark-brown hair */}
            <rect x="9" y="6" width="14" height="4" fill="#3f2e1e" />
            <rect x="8" y="10" width="3" height="6" fill="#3f2e1e" />
            <rect x="21" y="10" width="3" height="6" fill="#3f2e1e" />
            {/* Fierce eyes */}
            <rect x="11" y="13" width="3" height="1" fill="#1f160e" />
            <rect x="18" y="13" width="3" height="1" fill="#1f160e" />
            <rect x="12" y="14" width="2" height="2" fill="#0f172a" />
            <rect x="18" y="14" width="2" height="2" fill="#0f172a" />
            {/* Nose */}
            <rect x="15" y="15" width="2" height="3" fill="#e2ac80" />
            {/* Cossack-style hanging mustache */}
            <rect x="11" y="18" width="10" height="2" fill="#2b1d12" />
            <rect x="10" y="19" width="3" height="3" fill="#2b1d12" />
            <rect x="19" y="19" width="3" height="3" fill="#2b1d12" />
          </svg>
        );

      case 'petliura':
        // Симон Петлюра: Military cap with blue-yellow cockade, military tunic
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full [image-rendering:pixelated]" shapeRendering="crispEdges">
            <rect width="32" height="32" fill="#25241f" />
            {/* Military Greatcoat / Tunic */}
            <rect x="4" y="22" width="24" height="10" fill="#3f4b3b" />
            <rect x="14" y="22" width="4" height="10" fill="#d97706" />
            <rect x="13" y="22" width="1" height="4" fill="#eab308" />
            <rect x="18" y="22" width="1" height="4" fill="#eab308" />
            {/* Face */}
            <rect x="10" y="11" width="12" height="12" fill="#fbd5b5" />
            {/* Military Cap (Фуразка з кокардою) */}
            <rect x="7" y="5" width="18" height="6" fill="#374133" />
            <rect x="6" y="9" width="20" height="3" fill="#1e241c" />
            {/* Ukrainian Cockade */}
            <rect x="14" y="6" width="4" height="3" fill="#0284c7" />
            <rect x="15" y="7" width="2" height="2" fill="#eab308" />
            {/* Eyes */}
            <rect x="11" y="14" width="3" height="1" fill="#1c1917" />
            <rect x="18" y="14" width="3" height="1" fill="#1c1917" />
            <rect x="12" y="15" width="2" height="1" fill="#292524" />
            <rect x="18" y="15" width="2" height="1" fill="#292524" />
            {/* Nose and Mouth */}
            <rect x="15" y="16" width="2" height="3" fill="#e0a980" />
            <rect x="13" y="19" width="6" height="1" fill="#292524" />
            <rect x="14" y="20" width="4" height="2" fill="#e0a980" />
          </svg>
        );

      case 'skoropadsky':
        // Павло Скоропадський: Noble Hetman Cherkesska, papakha, aristocratic bearing
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full [image-rendering:pixelated]" shapeRendering="crispEdges">
            <rect width="32" height="32" fill="#1f2824" />
            {/* White Cherkesska with Gazyri cartridges */}
            <rect x="4" y="21" width="24" height="11" fill="#e2e8f0" />
            <rect x="7" y="23" width="5" height="3" fill="#b45309" />
            <rect x="20" y="23" width="5" height="3" fill="#b45309" />
            <rect x="13" y="21" width="6" height="11" fill="#047857" />
            {/* Face */}
            <rect x="11" y="11" width="10" height="11" fill="#fae0cb" />
            {/* Black Astrakhan Papakha */}
            <rect x="8" y="3" width="16" height="9" fill="#18181b" />
            <rect x="9" y="4" width="14" height="2" fill="#27272a" />
            {/* Eyes */}
            <rect x="12" y="13" width="2" height="2" fill="#0f172a" />
            <rect x="18" y="13" width="2" height="2" fill="#0f172a" />
            {/* General's mustache */}
            <rect x="12" y="17" width="8" height="2" fill="#52525b" />
            <rect x="11" y="18" width="2" height="1" fill="#52525b" />
            <rect x="19" y="18" width="2" height="1" fill="#52525b" />
          </svg>
        );

      case 'petrushevych':
        // Євген Петрушевич: European diplomat, Austrian parliamentarian demeanor
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full [image-rendering:pixelated]" shapeRendering="crispEdges">
            <rect width="32" height="32" fill="#1e2429" />
            <rect x="4" y="23" width="24" height="9" fill="#0f172a" />
            <rect x="13" y="23" width="6" height="9" fill="#f8fafc" />
            <rect x="15" y="24" width="2" height="4" fill="#0369a1" />
            {/* Face */}
            <rect x="10" y="9" width="12" height="14" fill="#fae0cb" />
            {/* Silver-grey hair */}
            <rect x="8" y="6" width="16" height="5" fill="#64748b" />
            <rect x="8" y="10" width="3" height="6" fill="#94a3b8" />
            <rect x="21" y="10" width="3" height="6" fill="#94a3b8" />
            {/* Eyes and wireframe specs */}
            <rect x="12" y="13" width="2" height="2" fill="#1e293b" />
            <rect x="18" y="13" width="2" height="2" fill="#1e293b" />
            {/* Neat grey mustache */}
            <rect x="13" y="17" width="6" height="2" fill="#94a3b8" />
          </svg>
        );

      case 'yefremov':
        // Сергій Єфремов: літературознавець, пенсне, акуратна борідка, метелик
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full [image-rendering:pixelated]" shapeRendering="crispEdges">
            <rect width="32" height="32" fill="#22262b" />
            <rect x="4" y="24" width="24" height="8" fill="#44403c" />
            <rect x="12" y="24" width="8" height="3" fill="#f8fafc" />
            <rect x="14" y="24" width="4" height="2" fill="#7f1d1d" />
            <rect x="10" y="8" width="12" height="15" fill="#f5d0b0" />
            <rect x="9" y="6" width="14" height="4" fill="#57534e" />
            <rect x="9" y="9" width="2" height="5" fill="#57534e" />
            <rect x="21" y="9" width="2" height="5" fill="#57534e" />
            <rect x="11" y="12" width="4" height="3" fill="#a8a29e" />
            <rect x="17" y="12" width="4" height="3" fill="#a8a29e" />
            <rect x="12" y="13" width="2" height="1" fill="#0f172a" />
            <rect x="18" y="13" width="2" height="1" fill="#0f172a" />
            <rect x="15" y="13" width="2" height="1" fill="#a8a29e" />
            <rect x="15" y="15" width="2" height="2" fill="#e0a980" />
            <rect x="12" y="18" width="8" height="1" fill="#57534e" />
            <rect x="13" y="19" width="6" height="4" fill="#78716c" />
            <rect x="14" y="23" width="4" height="1" fill="#78716c" />
          </svg>
        );

      case 'vernadsky':
        // Володимир Вернадський: вчений, сива борода, окуляри, білий комірець
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full [image-rendering:pixelated]" shapeRendering="crispEdges">
            <rect width="32" height="32" fill="#1d2630" />
            <rect x="4" y="24" width="24" height="8" fill="#3f3f46" />
            <rect x="12" y="24" width="8" height="3" fill="#f8fafc" />
            <rect x="10" y="8" width="12" height="15" fill="#f5d0b0" />
            <rect x="9" y="6" width="14" height="3" fill="#e5e7eb" />
            <rect x="8" y="9" width="3" height="6" fill="#d1d5db" />
            <rect x="21" y="9" width="3" height="6" fill="#d1d5db" />
            <rect x="11" y="12" width="4" height="3" fill="#78350f" />
            <rect x="17" y="12" width="4" height="3" fill="#78350f" />
            <rect x="12" y="13" width="2" height="1" fill="#bae6fd" />
            <rect x="18" y="13" width="2" height="1" fill="#bae6fd" />
            <rect x="15" y="13" width="2" height="1" fill="#78350f" />
            <rect x="15" y="15" width="2" height="2" fill="#e0a980" />
            <rect x="11" y="17" width="10" height="5" fill="#e5e7eb" />
            <rect x="13" y="21" width="6" height="4" fill="#f8fafc" />
            <rect x="14" y="18" width="4" height="1" fill="#9ca3af" />
          </svg>
        );

      case 'vitovsky':
        // Дмитро Вітовський: мазепинка УСС, сіро-зелений однострій
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full [image-rendering:pixelated]" shapeRendering="crispEdges">
            <rect width="32" height="32" fill="#1f2a2e" />
            <rect x="4" y="22" width="24" height="10" fill="#4b5d52" />
            <rect x="14" y="22" width="4" height="10" fill="#3a4a40" />
            <rect x="8" y="24" width="3" height="2" fill="#0284c7" />
            <rect x="21" y="24" width="3" height="2" fill="#eab308" />
            <rect x="10" y="11" width="12" height="12" fill="#f5d0b0" />
            <rect x="8" y="4" width="16" height="8" fill="#4b5d52" />
            <rect x="9" y="3" width="14" height="2" fill="#3a4a40" />
            <rect x="10" y="10" width="12" height="2" fill="#3a4a40" />
            <rect x="15" y="5" width="2" height="2" fill="#eab308" />
            <rect x="12" y="14" width="2" height="2" fill="#1c1917" />
            <rect x="18" y="14" width="2" height="2" fill="#1c1917" />
            <rect x="15" y="16" width="2" height="2" fill="#e0a980" />
            <rect x="12" y="19" width="8" height="1" fill="#57534e" />
          </svg>
        );

      case 'ohienko':
        // Іван Огієнко: професор, темне волосся, вуса, книжка
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full [image-rendering:pixelated]" shapeRendering="crispEdges">
            <rect width="32" height="32" fill="#2a2320" />
            <rect x="4" y="23" width="24" height="9" fill="#1e293b" />
            <rect x="13" y="23" width="6" height="5" fill="#f8fafc" />
            <rect x="15" y="24" width="2" height="5" fill="#b91c1c" />
            <rect x="20" y="26" width="6" height="5" fill="#b45309" />
            <rect x="21" y="27" width="4" height="3" fill="#fde68a" />
            <rect x="10" y="9" width="12" height="14" fill="#fbd5b5" />
            <rect x="9" y="6" width="14" height="4" fill="#292524" />
            <rect x="9" y="9" width="2" height="5" fill="#292524" />
            <rect x="21" y="9" width="2" height="5" fill="#292524" />
            <rect x="12" y="13" width="2" height="2" fill="#1c1917" />
            <rect x="18" y="13" width="2" height="2" fill="#1c1917" />
            <rect x="15" y="15" width="2" height="2" fill="#e0a980" />
            <rect x="12" y="18" width="8" height="2" fill="#292524" />
          </svg>
        );

      case 'soldier':
        // Вояк-делегат: шинель, папаха, синьо-жовта стрічка
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full [image-rendering:pixelated]" shapeRendering="crispEdges">
            <rect width="32" height="32" fill="#262a22" />
            <rect x="4" y="22" width="24" height="10" fill="#57603f" />
            <rect x="15" y="22" width="2" height="10" fill="#3f4630" />
            <rect x="6" y="23" width="4" height="2" fill="#0284c7" />
            <rect x="6" y="25" width="4" height="2" fill="#eab308" />
            <rect x="10" y="11" width="12" height="12" fill="#f0c49c" />
            <rect x="8" y="4" width="16" height="8" fill="#57534e" />
            <rect x="9" y="5" width="14" height="2" fill="#78716c" />
            <rect x="12" y="14" width="2" height="2" fill="#1c1917" />
            <rect x="18" y="14" width="2" height="2" fill="#1c1917" />
            <rect x="15" y="16" width="2" height="2" fill="#d69a70" />
            <rect x="11" y="18" width="10" height="2" fill="#78350f" />
            <rect x="10" y="19" width="2" height="2" fill="#78350f" />
            <rect x="20" y="19" width="2" height="2" fill="#78350f" />
          </svg>
        );

      case 'hero_boy':
        // Джура (хлопець): кашкет, вишиванка, торба через плече
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full [image-rendering:pixelated]" shapeRendering="crispEdges">
            <rect width="32" height="32" fill="#1e3a5f" />
            <rect x="0" y="26" width="32" height="6" fill="#ca8a04" />
            <rect x="5" y="22" width="22" height="10" fill="#f8fafc" />
            <rect x="14" y="22" width="4" height="6" fill="#dc2626" />
            <rect x="15" y="23" width="2" height="1" fill="#f8fafc" />
            <rect x="15" y="25" width="2" height="1" fill="#f8fafc" />
            <rect x="6" y="22" width="2" height="10" fill="#78350f" />
            <rect x="10" y="10" width="12" height="13" fill="#fcd5b4" />
            <rect x="8" y="6" width="16" height="5" fill="#334155" />
            <rect x="7" y="10" width="13" height="2" fill="#1e293b" />
            <rect x="10" y="11" width="2" height="3" fill="#7c2d12" />
            <rect x="12" y="14" width="2" height="2" fill="#0f172a" />
            <rect x="18" y="14" width="2" height="2" fill="#0f172a" />
            <rect x="11" y="17" width="2" height="1" fill="#fca5a5" />
            <rect x="19" y="17" width="2" height="1" fill="#fca5a5" />
            <rect x="14" y="19" width="4" height="1" fill="#9a3412" />
          </svg>
        );

      case 'hero_girl':
        // Джура (дівчина): вінок зі стрічками, коса, вишиванка
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full [image-rendering:pixelated]" shapeRendering="crispEdges">
            <rect width="32" height="32" fill="#1e3a5f" />
            <rect x="0" y="26" width="32" height="6" fill="#ca8a04" />
            <rect x="5" y="22" width="22" height="10" fill="#f8fafc" />
            <rect x="9" y="23" width="2" height="2" fill="#dc2626" />
            <rect x="21" y="23" width="2" height="2" fill="#dc2626" />
            <rect x="14" y="23" width="4" height="2" fill="#dc2626" />
            <rect x="22" y="12" width="3" height="14" fill="#a16207" />
            <rect x="23" y="26" width="2" height="2" fill="#0284c7" />
            <rect x="10" y="10" width="12" height="13" fill="#fcd5b4" />
            <rect x="9" y="7" width="14" height="5" fill="#a16207" />
            <rect x="8" y="5" width="3" height="3" fill="#dc2626" />
            <rect x="12" y="4" width="3" height="3" fill="#facc15" />
            <rect x="16" y="4" width="3" height="3" fill="#2563eb" />
            <rect x="20" y="5" width="3" height="3" fill="#dc2626" />
            <rect x="12" y="14" width="2" height="2" fill="#0f172a" />
            <rect x="18" y="14" width="2" height="2" fill="#0f172a" />
            <rect x="11" y="17" width="2" height="1" fill="#fca5a5" />
            <rect x="19" y="17" width="2" height="1" fill="#fca5a5" />
            <rect x="14" y="19" width="4" height="1" fill="#be123c" />
          </svg>
        );

      case 'pigeon':
        // Сизокрил: поштовий голуб із листом
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full [image-rendering:pixelated]" shapeRendering="crispEdges">
            <rect width="32" height="32" fill="#7dd3fc" />
            <rect x="0" y="24" width="32" height="8" fill="#fde68a" />
            <rect x="9" y="13" width="14" height="10" fill="#94a3b8" />
            <rect x="11" y="11" width="10" height="3" fill="#94a3b8" />
            <rect x="18" y="7" width="7" height="7" fill="#64748b" />
            <rect x="19" y="12" width="5" height="2" fill="#10b981" />
            <rect x="21" y="9" width="2" height="2" fill="#f8fafc" />
            <rect x="22" y="9" width="1" height="1" fill="#0f172a" />
            <rect x="25" y="10" width="3" height="2" fill="#f59e0b" />
            <rect x="6" y="15" width="9" height="5" fill="#cbd5e1" />
            <rect x="4" y="17" width="4" height="3" fill="#475569" />
            <rect x="12" y="16" width="8" height="1" fill="#475569" />
            <rect x="13" y="23" width="1" height="2" fill="#f97316" />
            <rect x="18" y="23" width="1" height="2" fill="#f97316" />
            <rect x="15" y="18" width="5" height="4" fill="#fef3c7" />
            <rect x="15" y="18" width="5" height="1" fill="#dc2626" />
          </svg>
        );

      default:
        // Default statesman delegate
        return (
          <svg viewBox="0 0 32 32" className="w-full h-full [image-rendering:pixelated]" shapeRendering="crispEdges">
            <rect width="32" height="32" fill="#2d2926" />
            <rect x="4" y="22" width="24" height="10" fill="#334155" />
            <rect x="10" y="8" width="12" height="14" fill="#fbd5b5" />
            <rect x="8" y="5" width="16" height="5" fill="#1e293b" />
            <rect x="12" y="13" width="2" height="2" fill="#0f172a" />
            <rect x="18" y="13" width="2" height="2" fill="#0f172a" />
            <rect x="13" y="18" width="6" height="2" fill="#1e293b" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative inline-block overflow-hidden border-2 border-amber-600/70 bg-stone-900 shadow-md ${sizeClasses} ${className}`}
      style={{ imageRendering: 'pixelated' }}
    >
      {renderSvgPortrait()}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  );
};
