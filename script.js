/**
 * BNI 鑑（かがみ）チャプター LP — script.js
 *
 * 機能一覧:
 *   1. スムーズスクロール（.js-smooth-scroll）
 *   2. FAQアコーディオン（.faq-item）
 *   3. スティッキーバー表示制御（#stickyBar）
 *   4. スクロールフェードイン（.fade-in → .visible）
 */

'use strict';

/* ================================================================
   ユーティリティ
   ================================================================ */

/**
 * 要素がビューポートに入ったかを監視する IntersectionObserver を生成
 * @param {NodeList|Array} elements - 対象要素の配列
 * @param {Function} callback - 交差時のコールバック(entry, observer)
 * @param {Object} options - IntersectionObserver オプション
 */
function createObserver(elements, callback, options = {}) {
  const defaultOptions = { threshold: 0.12, ...options };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => callback(entry, observer));
  }, defaultOptions);
  elements.forEach((el) => observer.observe(el));
  return observer;
}


/* ================================================================
   1. スムーズスクロール
   js-smooth-scroll クラスが付いた <a> をクリックしたとき
   href="#xxx" のターゲットへなめらかにスクロール
   ================================================================ */
function initSmoothScroll() {
  const links = document.querySelectorAll('.js-smooth-scroll');

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      // スティッキーバー（56px）分だけオフセット
      const stickyBar = document.getElementById('stickyBar');
      const offset = stickyBar ? stickyBar.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}


/* ================================================================
   2. FAQアコーディオン
   .faq-item[data-open] をトグルし、max-height でアニメーション
   ================================================================ */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    const button = item.querySelector('.faq-question');
    if (!button) return;

    button.addEventListener('click', () => {
      const isOpen = item.dataset.open === 'true';

      // すべて閉じる（アコーディオン動作：1つだけ開く）
      // ※ 複数同時展開を許可する場合はこの forEach を削除
      faqItems.forEach((other) => {
        if (other !== item) {
          other.dataset.open = 'false';
          const otherBtn = other.querySelector('.faq-question');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // クリックされたアイテムをトグル
      item.dataset.open = isOpen ? 'false' : 'true';
      button.setAttribute('aria-expanded', String(!isOpen));
    });
  });
}


/* ================================================================
   3. スティッキーバー 表示制御
   条件: スクロール30%超 かつ FV(#s1)がビューポート外 かつ CTA(#s11)がビューポート外
   ================================================================ */
function initStickyBar() {
  const stickyBar = document.getElementById('stickyBar');
  const heroSection  = document.getElementById('s1');
  const finalSection = document.getElementById('s11');

  if (!stickyBar || !heroSection || !finalSection) return;

  let heroVisible  = true;  // 初期状態: FV が見えている
  let finalVisible = false; // 初期状態: 最終CTAは見えていない

  /**
   * スティッキーバーの表示/非表示を更新
   *
   * [CV改善7] 表示条件を改善:
   *   旧: スクロール30% かつ FV非表示 かつ 最終CTA非表示
   *   新: FV非表示 かつ 最終CTA非表示
   *
   * 理由: heroVisible=false の時点で既にFVを離れており十分なスクロールが発生している。
   * 30%の閾値はその後さらに遅延を加えるだけで、離脱タイミングとスティッキーバー
   * 表示タイミングのギャップ（離脱機会の損失）を生じさせていた。
   */
  function updateStickyBar() {
    // [CV改善7] 30%スクロール条件を廃止 — heroVisible=falseが実質的な条件として十分
    const shouldShow = !heroVisible && !finalVisible;

    if (shouldShow) {
      stickyBar.classList.add('is-visible');
      stickyBar.setAttribute('aria-hidden', 'false');
    } else {
      stickyBar.classList.remove('is-visible');
      stickyBar.setAttribute('aria-hidden', 'true');
    }
  }

  // IntersectionObserver でヒーローと最終CTAの可視状態を監視
  const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.target === heroSection) {
        heroVisible = entry.isIntersecting;
      }
      if (entry.target === finalSection) {
        finalVisible = entry.isIntersecting;
      }
    });
    updateStickyBar();
  }, { threshold: 0.01 });

  visibilityObserver.observe(heroSection);
  visibilityObserver.observe(finalSection);

  // [品質改善] scrollイベントリスナーを削除:
  // CV改善7でscrollRatio条件を廃止した結果、このリスナーは
  // updateStickyBar() を呼ぶだけになったが、
  // IntersectionObserver が既に heroVisible/finalVisible を管理しており
  // scroll イベントは何も新しい情報を追加しない（dead code）。
  // 削除することでパフォーマンスを改善。
}


/* ================================================================
   4. スクロールフェードイン
   .fade-in 要素がビューポートに入ったら .visible を付与
   --delay CSS変数でスタガーアニメーションに対応
   ================================================================ */
function initFadeIn() {
  const fadeElements = document.querySelectorAll('.fade-in');

  if (!fadeElements.length) return;

  // IntersectionObserver 非対応ブラウザのフォールバック
  if (!('IntersectionObserver' in window)) {
    fadeElements.forEach((el) => el.classList.add('visible'));
    return;
  }

  createObserver(
    fadeElements,
    (entry, observer) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // 一度表示したら監視解除
      }
    },
    { threshold: 0.12 }
  );
}


/* ================================================================
   初期化
   DOMContentLoaded 後にすべての機能を起動
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initFAQ();
  initStickyBar();
  initFadeIn();
});
