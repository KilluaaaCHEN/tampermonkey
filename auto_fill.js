// ==UserScript==
// @name         表单自动填充助手
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在表单输入框后添加填充图标，支持中文、数字和字母的随机填充
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // 配置选项
  const CONFIG = {
    iconText: '⚡', // 可以使用emoji或文字，如：'填充'、'⚡'、'🔍'
    iconColor: '#4CAF50',
    iconHoverColor: '#45a049',
    iconSize: '16px',
    iconMargin: '5px',
    iconPosition: 'inline', // 'inline' 或 'absolute'
    showFieldName: true // 是否在填充时显示字段名称
  };

  // 中文数据源
  const CHINESE_DATA = {
    names: ['张三', '李四', '王五', '赵六', '刘七', '陈八', '杨九', '周十', '吴十一', '郑十二'],
    cities: ['北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都', '重庆', '西安'],
    companies: ['科技有限公司', '贸易有限公司', '发展有限公司', '集团股份有限公司', '信息技术有限公司'],
    addresses: ['人民路123号', '中山路456号', '解放路789号', '建设路101号', '和平路202号'],
    emails: ['example', 'test', 'user', 'admin', 'contact'],
    domains: ['gmail.com', 'qq.com', '163.com', 'outlook.com', 'yahoo.com']
  };

  // 生成随机数据
  const DataGenerator = {
    // 随机中文
    chinese: (length = 2) => {
      const chars = '的一是不了在人有我他这中大来上国个到说们为子和你地出道也时年生以就那要得于下自之会过家去对里后小么心多天而能好都然没日于起还发成事只作当想看文无开手十用主行方又如前所本见经头面公同三已老从动两长党种马上现政四机李男路活真感山金水业代全关各其美已女直';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },

    // 随机姓名
    name: () => {
      const surname = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜';
      const nameChars = '伟芳娜秀英敏静丽强艳军杰涛明超秀兰霞平刚亮';
      return surname.charAt(Math.floor(Math.random() * surname.length)) +
          nameChars.charAt(Math.floor(Math.random() * nameChars.length));
    },

    // 随机手机号
    phone: () => {
      const prefixes = ['13', '15', '18', '19'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      let suffix = '';
      for (let i = 0; i < 9; i++) {
        suffix += Math.floor(Math.random() * 10);
      }
      return prefix + suffix;
    },

    // 随机座机电话（区号-号码）
    landline: () => {
      const areaCodes = ['010', '021', '022', '023', '024', '025', '027', '028', '029', '0571', '0755', '020'];
      const area = areaCodes[Math.floor(Math.random() * areaCodes.length)];
      const len = Math.random() < 0.7 ? 8 : 7;
      let num = '';
      for (let i = 0; i < len; i++) num += Math.floor(Math.random() * 10);
      const ext = Math.random() < 0.2 ? `-${Math.floor(100 + Math.random() * 900)}` : '';
      return `${area}-${num}${ext}`;
    },

    // 随机邮箱
    email: () => {
      const name = CHINESE_DATA.emails[Math.floor(Math.random() * CHINESE_DATA.emails.length)];
      const domain = CHINESE_DATA.domains[Math.floor(Math.random() * CHINESE_DATA.domains.length)];
      const randomNum = Math.floor(Math.random() * 1000);
      return `${name}${randomNum}@${domain}`;
    },

    // 随机地址
    address: () => {
      const city = CHINESE_DATA.cities[Math.floor(Math.random() * CHINESE_DATA.cities.length)];
      const addr = CHINESE_DATA.addresses[Math.floor(Math.random() * CHINESE_DATA.addresses.length)];
      return `${city}市${addr}`;
    },

    // 随机数字
    number: (min = 1000, max = 9999) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // 随机英文字母
    letters: (length = 8) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },

    // 混合数据
    mixed: (length = 10) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789中文测试';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  };

  // 支持 hover 选择类型：为 input 记住一次选择（跨刷新持久化）
  // - WeakMap：当前页面运行期快速命中
  // - localStorage：按站点(host) + 字段特征(key) 持久化，刷新后仍生效
  const FIELD_TYPE_MEMORY = new WeakMap();

  // v2：ElementPlus 场景优先用 label 文本做稳定 key（避免动态 id / fidx / path 导致刷新后匹配失败）
  // 同时保留 v1 兼容读取（你之前已经写入的一批数据不会立刻失效）。
  const STORAGE_PREFIX_V1 = 'autoFill.type.v1';
  const STORAGE_PREFIX_V2 = 'autoFill.type.v2';

  // input -> icon 绑定（避免 nextElementSibling 在复杂 DOM/slot 下不稳定）
  const INPUT_ICON_MAP = new WeakMap();

  function getHostKey() {
    return location.host || 'unknown-host';
  }

  function normalizeLikelyDynamicId(id) {
    const v = (id || '').toLowerCase().trim();
    if (!v) return '';

    // 1) 超长/包含明显随机串/uuid：直接忽略
    if (v.length >= 24) return '';

    // 2) uuid 形态
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v)) return '';

    // 3) 末尾大段数字（常见时间戳/自增）
    if (/[0-9]{6,}$/.test(v)) return '';

    // 4) 包含明显随机段：如 _k3j9x2 或 -a1b2c3d4
    if (/[-_][0-9a-z]{6,}$/.test(v)) return '';

    return v;
  }

  function getNearbyLabelText(input) {
    try {
      // 0) ElementPlus/表单常见结构：el-form-item 内部 label 与 input 同属于一个 item
      // 示例：<div class="el-form-item"> <label ...>租户企业名称</label> ... <input ...>
      const formItem = input.closest?.('.el-form-item');
      if (formItem) {
        const lbl = formItem.querySelector('label.el-form-item__label, label');
        if (lbl) {
          const t = (lbl.innerText || lbl.textContent || '').trim();
          if (t) return t;
        }
      }

      // 0.1) ElementPlus 行列布局：该 input 所在 el-form-item 可能没有 label（例如“详细地址”）
      // 这时尝试在同一行(el-row)中查找“兄弟 el-form-item”上的 label 作为提示。
      // 你的示例：左侧 el-col 里有 label“企业地址”，右侧 el-col 里是详细地址输入框（无 label）
      const col = input.closest?.('.el-col');
      const row = input.closest?.('.el-row');
      if (col && row) {
        const cols = Array.from(row.querySelectorAll(':scope > .el-col'));
        const myIndex = cols.indexOf(col);
        if (myIndex >= 0) {
          // 优先取左侧最近的有 label 的表单项
          for (let i = myIndex - 1; i >= 0; i--) {
            const c = cols[i];
            const lbl = c.querySelector?.('.el-form-item__label');
            if (lbl) {
              const t = (lbl.innerText || lbl.textContent || '').trim();
              if (t) return t;
            }
          }
          // 再取右侧
          for (let i = myIndex + 1; i < cols.length; i++) {
            const c = cols[i];
            const lbl = c.querySelector?.('.el-form-item__label');
            if (lbl) {
              const t = (lbl.innerText || lbl.textContent || '').trim();
              if (t) return t;
            }
          }
        }
      }

      // 1) label[for=id]
      const id = input.getAttribute?.('id');
      if (id) {
        const lbl = document.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (lbl) return (lbl.innerText || lbl.textContent || '').trim();
      }

      // 2) 最近的 label（包裹型）
      const wrapLabel = input.closest?.('label');
      if (wrapLabel) return (wrapLabel.innerText || wrapLabel.textContent || '').trim();

      // 3) 向上找相邻 label（一些布局 label 与 input 同级或前置）
      let p = input.parentElement;
      for (let i = 0; i < 4 && p; i++) {
        const near = p.querySelector?.('label');
        if (near) {
          const t = (near.innerText || near.textContent || '').trim();
          if (t) return t;
        }
        p = p.parentElement;
      }
    } catch (e) {
      // ignore
    }
    return '';
  }

  function getFieldPersistKey(input) {
    // 重点：避免把“易变的 id”作为主要特征，否则刷新后匹配不到
    const tag = (input.tagName || '').toLowerCase();
    const type = (input.type || '').toLowerCase();
    const name = (input.name || '').toLowerCase().trim();
    const ph = (input.placeholder || '').toLowerCase().trim();

    const stableId = normalizeLikelyDynamicId(input.id);
    const ariaLabel = (input.getAttribute?.('aria-label') || '').toLowerCase().trim();
    const ariaLabelledBy = (input.getAttribute?.('aria-labelledby') || '').toLowerCase().trim();
    const labelText = (getNearbyLabelText(input) || '').toLowerCase().trim();

    // 位置特征：同一表单内的顺序（相对稳定，且不依赖动态 id）
    let formIndex = -1;
    try {
      const form = input.closest?.('form');
      if (form) {
        const list = Array.from(form.querySelectorAll('input, textarea, select'));
        formIndex = list.indexOf(input);
      }
    } catch (e) {
      // ignore
    }

    // selector path：取到 2-3 层 class/tag，尽量稳定（过滤掉明显动态 class）
    let path = '';
    try {
      let node = input;
      const segs = [];
      for (let i = 0; i < 3 && node && node instanceof Element; i++) {
        const tagName = node.tagName.toLowerCase();
        const cls = (node.className || '')
          .toString()
          .split(/\s+/)
          .map(s => s.trim().toLowerCase())
          .filter(Boolean)
          .filter(s => !/[0-9]{6,}$/.test(s))      // 过滤末尾大数字
          .filter(s => s.length <= 24)            // 过滤超长
          .slice(0, 2)
          .join('.');
        segs.push(cls ? `${tagName}.${cls}` : tagName);
        node = node.parentElement;
      }
      path = segs.join('>');
    } catch (e) {
      // ignore
    }

    const parts = [
      `tag:${tag}`,
      `type:${type}`,
      `name:${name}`,
      `ph:${ph}`,
      `aria:${ariaLabel}`,
      `lblby:${ariaLabelledBy}`,
      `label:${labelText}`,
      `id:${stableId}`,          // 只有稳定 id 才会进入 key
      `fidx:${formIndex}`,
      `path:${path}`
    ];

    return parts.join('|');
  }

  function getStableLabelKey(input) {
    const labelText = (getNearbyLabelText(input) || '').toLowerCase().trim();
    if (!labelText) return '';
    // 过长的 label 可能包含一大段文本，简单截断避免 key 过长
    return labelText.slice(0, 64);
  }

  function storageKeyV2ForInput(input) {
    const labelKey = getStableLabelKey(input);
    if (!labelKey) return '';
    return `${STORAGE_PREFIX_V2}:${getHostKey()}:label:${labelKey}`;
  }

  function storageKeyV1ForInput(input) {
    return `${STORAGE_PREFIX_V1}:${getHostKey()}:${getFieldPersistKey(input)}`;
  }

  function storageKeyForInput(input) {
    // 写入默认用 v2（更稳）；若 v2 没法用（没有 label），再 fallback v1
    return storageKeyV2ForInput(input) || storageKeyV1ForInput(input);
  }

  function updateIconRememberedState(input) {
    try {
      const icon = INPUT_ICON_MAP.get(input) || input.nextElementSibling;
      if (!icon || !icon.classList?.contains('auto-fill-icon')) return;

      let remembered = FIELD_TYPE_MEMORY.get(input);
      if (!remembered) remembered = loadPersistedFieldType(input);

      const active = remembered && remembered !== 'auto';
      if (active) {
        icon.classList.add('auto-fill-icon--remembered');
      } else {
        icon.classList.remove('auto-fill-icon--remembered');
      }
    } catch (e) {
      // ignore
    }
  }

  function persistFieldType(input, typeKey) {
    try {
      const key = storageKeyForInput(input);
      if (!key) return;

      if (!typeKey || typeKey === 'auto') {
        // 清理 v2/v1（如果存在）
        const keyV2 = storageKeyV2ForInput(input);
        const keyV1 = storageKeyV1ForInput(input);
        if (keyV2) localStorage.removeItem(keyV2);
        if (keyV1) localStorage.removeItem(keyV1);

        updateIconRememberedState(input);
        return;
      }

      localStorage.setItem(key, typeKey);
      updateIconRememberedState(input);
    } catch (e) {
      // ignore (可能被禁用/隐私模式)
    }
  }

  function loadPersistedFieldType(input) {
    try {
      // 读取优先 v2（label key），找不到再 fallback v1（兼容旧数据）
      const k2 = storageKeyV2ForInput(input);
      if (k2) {
        const v2 = localStorage.getItem(k2);
        if (v2) return v2;
      }
      const k1 = storageKeyV1ForInput(input);
      if (k1) {
        const v1 = localStorage.getItem(k1);
        if (v1) return v1;
      }
      return '';
    } catch (e) {
      return '';
    }
  }

  // 方便手动排查：在控制台可用 window.__AUTO_FILL_DEBUG 查看 key 生成结果
  try {
    window.__AUTO_FILL_DEBUG = window.__AUTO_FILL_DEBUG || {};
    window.__AUTO_FILL_DEBUG.storageKeyForInput = storageKeyForInput;
    window.__AUTO_FILL_DEBUG.storageKeyV2ForInput = storageKeyV2ForInput;
    window.__AUTO_FILL_DEBUG.storageKeyV1ForInput = storageKeyV1ForInput;
    window.__AUTO_FILL_DEBUG.STORAGE_PREFIX_V2 = STORAGE_PREFIX_V2;
    window.__AUTO_FILL_DEBUG.STORAGE_PREFIX_V1 = STORAGE_PREFIX_V1;
  } catch (e) {
    // ignore
  }

  const FILL_TYPES = [
    { key: 'auto', label: '自动', icon: '⚙️' },
    { key: 'name', label: '姓名', icon: '👤' },
    { key: 'phone', label: '手机号', icon: '📱' },
    { key: 'landline', label: '电话(座机)', icon: '☎️' },
    { key: 'email', label: '邮箱', icon: '✉️' },
    { key: 'address', label: '地址', icon: '📍' },
    { key: 'url', label: '网址', icon: '🔗' },
    { key: 'date', label: '日期(yyyy-mm-dd)', icon: '📅' },

    { key: '__sep__' },

    { key: 'company', label: '公司名称', icon: '🏢' },
    { key: 'creditCode', label: '统一社会信用代码', icon: '🪪' },
    { key: 'licenseNo', label: '营业执照号(15位)', icon: '📄' },
    { key: 'taxNo', label: '纳税人识别号', icon: '🧾' },

    { key: '__sep__' },

    { key: 'number', label: '数字', icon: '🔢' },
    { key: 'letters', label: '字母', icon: '🔤' },
    { key: 'mixed', label: '混合', icon: '🧩' }
  ];

  function genCreditCode() {
    // 统一社会信用代码：18位，通常为数字+大写字母（不含 I/O/S/V/Z）
    const chars = '0123456789ABCDEFGHJKLMNPQRTUWXY';
    let s = '';
    for (let i = 0; i < 18; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return s;
  }

  function genLicenseNo15() {
    // 老版营业执照注册号常见 15 位数字（这里生成一个看起来合理的随机数）
    let s = '';
    for (let i = 0; i < 15; i++) s += Math.floor(Math.random() * 10);
    return s;
  }

  function genTaxNo() {
    // 简化：多数场景用统一社会信用代码即可，这里做一个兼容生成
    return genCreditCode();
  }

  function generateCompanyName() {
    const prefix = ['北京', '上海', '深圳', '广州', '杭州', '南京', '武汉', '成都', '重庆', '西安'];
    const mid = ['云', '数', '智', '星', '航', '蓝', '新', '创', '合', '启'];
    const biz = ['科技', '信息', '网络', '软件', '数据', '智能', '企业服务', '供应链', '咨询', '贸易'];
    const suffix = CHINESE_DATA.companies[Math.floor(Math.random() * CHINESE_DATA.companies.length)];
    return `${prefix[Math.floor(Math.random() * prefix.length)]}${mid[Math.floor(Math.random() * mid.length)]}${biz[Math.floor(Math.random() * biz.length)]}${suffix}`;
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function formatDateYMD(d) {
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    return `${y}-${m}-${day}`;
  }

  function randomDateYMD() {
    // 默认取最近 365 天内的某一天
    const now = new Date();
    const offsetDays = Math.floor(Math.random() * 365);
    const d = new Date(now.getTime() - offsetDays * 24 * 3600 * 1000);
    return formatDateYMD(d);
  }

  function generateByType(typeKey) {
    switch (typeKey) {
      case 'name':
        return DataGenerator.name();
      case 'phone':
        return DataGenerator.phone();
      case 'landline':
        return DataGenerator.landline();
      case 'email':
        return DataGenerator.email();
      case 'date':
        return randomDateYMD();
      case 'address':
        return DataGenerator.address();
      case 'company':
        return generateCompanyName();
      case 'creditCode':
        return genCreditCode();
      case 'licenseNo':
        return genLicenseNo15();
      case 'taxNo':
        return genTaxNo();
      case 'url':
        return `https://www.${DataGenerator.letters(6)}.com`;
      case 'number':
        return String(DataGenerator.number());
      case 'letters':
        return DataGenerator.letters(8);
      case 'mixed':
        return DataGenerator.mixed(8);
      case 'auto':
      default:
        return null;
    }
  }

  // 根据输入框类型生成合适的填充内容（auto 模式）
  function generateFillContent(input) {
    const type = input.type ? input.type.toLowerCase() : '';
    const name = input.name ? input.name.toLowerCase() : '';
    const id = input.id ? input.id.toLowerCase() : '';
    const placeholder = input.placeholder || '';
    const className = input.className || '';

    // 若用户手动选过类型，优先用记忆类型（WeakMap -> localStorage）
    let remembered = FIELD_TYPE_MEMORY.get(input);
    if (!remembered) {
      const persisted = loadPersistedFieldType(input);
      if (persisted) {
        remembered = persisted;
        FIELD_TYPE_MEMORY.set(input, remembered);
      }
    }
    if (remembered && remembered !== 'auto') {
      const v = generateByType(remembered);
      if (v != null) return v;
    }

    // 根据类型、名称等关键词判断
    if (type === 'email' || name.includes('email') || id.includes('email') || placeholder.includes('邮箱')) {
      return DataGenerator.email();
    }
    else if (type === 'tel' || name.includes('phone') || name.includes('mobile') || id.includes('phone') ||
        id.includes('mobile') || placeholder.includes('手机') || placeholder.includes('手机号')) {
      return DataGenerator.phone();
    }
    else if (name.includes('landline') || id.includes('landline') || placeholder.includes('座机') || placeholder.includes('固话') ||
        placeholder.includes('电话') || placeholder.includes('联系电话')) {
      return DataGenerator.landline();
    }
    else if (type === 'date' || name.includes('date') || id.includes('date') ||
        placeholder.includes('开始日期') || placeholder.includes('结束日期') || placeholder.includes('日期') ||
        placeholder.includes('生效') || placeholder.includes('失效')) {
      return randomDateYMD();
    }
    else if (type === 'text' && (name.includes('name') || id.includes('name') || placeholder.includes('姓名') ||
        placeholder.includes('名字'))) {
      return DataGenerator.name();
    }
    else if (name.includes('address') || id.includes('address') || placeholder.includes('地址')) {
      return DataGenerator.address();
    }
    else if (type === 'number' || name.includes('number') || id.includes('number') ||
        name.includes('age') || id.includes('age') || placeholder.includes('年龄')) {
      return DataGenerator.number(18, 60);
    }
    else if (type === 'password') {
      return DataGenerator.mixed(12);
    }
    else if (type === 'url' || name.includes('url') || id.includes('url') || placeholder.includes('网址')) {
      return `https://www.${DataGenerator.letters(6)}.com`;
    }
    else if (name.includes('credit') || name.includes('creditcode') || id.includes('credit') || id.includes('creditcode') ||
        placeholder.includes('统一社会信用') || placeholder.includes('社会信用') || placeholder.includes('信用代码')) {
      return genCreditCode();
    }
    else if (name.includes('license') || name.includes('licence') || id.includes('license') || id.includes('licence') ||
        placeholder.includes('营业执照') || placeholder.includes('执照号') || placeholder.includes('注册号')) {
      return genLicenseNo15();
    }
    else if (name.includes('tax') || id.includes('tax') || placeholder.includes('纳税人识别号') || placeholder.includes('税号')) {
      return genTaxNo();
    }
    else if (name.includes('company') || id.includes('company') || placeholder.includes('公司')) {
      return generateCompanyName();
    }
    else if (type === 'text') {
      // 随机选择一种类型的内容
      const types = ['chinese', 'mixed', 'letters', 'number'];
      const selectedType = types[Math.floor(Math.random() * types.length)];
      switch(selectedType) {
        case 'chinese': return DataGenerator.chinese(3);
        case 'mixed': return DataGenerator.mixed(8);
        case 'letters': return DataGenerator.letters(8);
        case 'number': return DataGenerator.number();
        default: return DataGenerator.mixed(8);
      }
    }
    else {
      return DataGenerator.mixed(8);
    }
  }

  function getInputMaxLength(input) {
    // 兼容：maxlength 可能不存在 / 为 -1 / 或者是字符串
    const raw = input?.getAttribute?.('maxlength');
    if (raw == null) return Infinity;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return Infinity;
    return n;
  }

  function clampToMaxLength(input, text) {
    const max = getInputMaxLength(input);
    const s = String(text ?? '');
    if (!Number.isFinite(max) || max === Infinity) return s;

    // maxlength 按“字符数”限制：这里用 Array.from 处理 surrogate pair（emoji 等）
    const arr = Array.from(s);
    return arr.length > max ? arr.slice(0, max).join('') : s;
  }

  function setInputValueLikeUser(input, value) {
    // 不做逐字：只保证长度，并触发必要事件（兼容 Vue/React/ElementPlus 的 v-model/校验）
    const v = clampToMaxLength(input, value);

    try { input.focus(); } catch (e) {}
    input.value = v;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return v;
  }

  function fillInput(input, typeKey = 'auto') {
    const oldValue = input.value;

    let content = null;
    if (typeKey && typeKey !== 'auto') {
      content = generateByType(typeKey);
      FIELD_TYPE_MEMORY.set(input, typeKey);
      persistFieldType(input, typeKey);
    }
    if (content == null) {
      content = generateFillContent(input);
    }

    // 永不超过 maxlength
    const finalValue = setInputValueLikeUser(input, content);

    showFillNotification(input, oldValue, finalValue);
  }

  function getRememberedTypeKey(input) {
    let remembered = FIELD_TYPE_MEMORY.get(input);
    if (!remembered) {
      const persisted = loadPersistedFieldType(input);
      if (persisted) {
        remembered = persisted;
        FIELD_TYPE_MEMORY.set(input, remembered);
      }
    }
    return remembered || '';
  }

  function isRememberedField(input) {
    const remembered = getRememberedTypeKey(input);
    return !!(remembered && remembered !== 'auto');
  }

  let IS_BATCH_FILLING = false;

  function fillAllRememberedFields() {
    // 只填充“蓝色闪电”的字段：即有持久化类型选择的字段
    let filled = 0;

    IS_BATCH_FILLING = true;
    try {
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach((input) => {
        if (!isFillableInput(input)) return;

        const typeKey = getRememberedTypeKey(input);
        if (!typeKey || typeKey === 'auto') return;

        fillInput(input, typeKey);
        filled++;
      });
    } finally {
      IS_BATCH_FILLING = false;
    }

    // 一键填充只提示一次（不刷屏）
    showToast(filled > 0 ? `已一键填充 ${filled} 项` : '没有可一键填充的字段', { duration: 1400 });
  }

  function ensureOneClickFillButton() {
    if (document.getElementById('auto-fill-one-click')) return;

    const btn = document.createElement('button');
    btn.id = 'auto-fill-one-click';
    btn.type = 'button';
    btn.textContent = '一键填充';
    btn.title = '仅填充已选择过类型（蓝色⚡）的字段';
    btn.style.cssText = `
      position: fixed;
      right: 16px;
      top: 72px;
      z-index: 999999;
      background: linear-gradient(135deg, #1677ff, #69b1ff);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.35);
      border-radius: 12px;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      box-shadow: 0 10px 26px rgba(22,119,255,0.28);
      user-select: none;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-1px)';
      btn.style.boxShadow = '0 12px 30px rgba(22,119,255,0.34)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'none';
      btn.style.boxShadow = '0 10px 26px rgba(22,119,255,0.28)';
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fillAllRememberedFields();
    });

    document.body.appendChild(btn);
  }

  function createTypeMenu(icon, input) {
    // 单例：避免同一个 icon 反复创建
    if (icon._autoFillMenu) return icon._autoFillMenu;

    const menu = document.createElement('div');
    menu.className = 'auto-fill-type-menu';
    menu.style.cssText = `
      position: absolute;
      z-index: 999999;
      background: #fff;
      border: 1px solid rgba(0,0,0,0.12);
      box-shadow: 0 6px 18px rgba(0,0,0,0.15);
      border-radius: 6px;
      padding: 6px;
      display: none;
      min-width: 140px;
      font-size: 12px;
      line-height: 1.2;
    `;

    const remembered = FIELD_TYPE_MEMORY.get(input) || 'auto';

    FILL_TYPES.forEach(t => {
      // 分隔线（不可点击）
      if (t.key === '__sep__') {
        const sep = document.createElement('div');
        sep.className = 'auto-fill-type-sep';
        sep.style.cssText = `
          height: 1px;
          background: rgba(0,0,0,0.10);
          margin: 6px 6px;
        `;
        menu.appendChild(sep);
        return;
      }

      const item = document.createElement('div');
      item.className = 'auto-fill-type-item';
      item.dataset.typeKey = t.key;
      item.style.cssText = `
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        color: #333;
        user-select: none;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      `;

      const iconSpan = document.createElement('span');
      iconSpan.className = 'auto-fill-type-item-icon';
      iconSpan.textContent = t.icon || '•';
      iconSpan.style.cssText = `
        width: 18px;
        text-align: center;
        flex: 0 0 18px;
      `;

      const textSpan = document.createElement('span');
      textSpan.className = 'auto-fill-type-item-text';
      textSpan.textContent = t.label;

      const checkSpan = document.createElement('span');
      checkSpan.className = 'auto-fill-type-item-check';
      checkSpan.textContent = t.key === remembered ? '✓' : '';
      checkSpan.style.cssText = `
        margin-left: auto;
        color: #2e7d32;
        font-weight: 700;
      `;

      item.appendChild(iconSpan);
      item.appendChild(textSpan);
      item.appendChild(checkSpan);
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(76, 175, 80, 0.12)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fillInput(input, t.key);
        hideMenu(menu);
      });
      menu.appendChild(item);
    });

    document.body.appendChild(menu);
    icon._autoFillMenu = menu;

    // 点击其他地方关闭
    const onDocClick = (e) => {
      if (e.target === icon) return;
      if (menu.contains(e.target)) return;
      hideMenu(menu);
    };
    menu._onDocClick = onDocClick;
    document.addEventListener('mousedown', onDocClick, true);

    return menu;
  }

  function showMenu(icon, input) {
    const menu = createTypeMenu(icon, input);

    // 刷新打勾状态
    const remembered = FIELD_TYPE_MEMORY.get(input) || 'auto';
    menu.querySelectorAll('.auto-fill-type-item').forEach(item => {
      const key = item.dataset.typeKey;
      const check = item.querySelector('.auto-fill-type-item-check');
      if (check) check.textContent = key === remembered ? '✓' : '';
    });

    // 先显示（用于测量高度）
    menu.style.display = 'block';
    menu.style.visibility = 'hidden';
    menu.style.top = '0px';
    menu.style.left = '0px';

    const rect = icon.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 优先向下展开，若下方空间不足则向上展开
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;

    let top;
    if (spaceBelow >= menuRect.height + margin || spaceBelow >= spaceAbove) {
      // 向下展开：下移一点，避免遮挡⚡
      top = rect.bottom + 10;
    } else {
      // 向上展开：上移一点，避免贴得太近挡到⚡
      top = rect.top - menuRect.height - 12;
    }

    // 左右边界处理
    let left = rect.left;
    if (left + menuRect.width + margin > vw) {
      left = vw - menuRect.width - margin;
    }
    if (left < margin) left = margin;

    // 上下边界兜底
    if (top + menuRect.height + margin > vh) {
      top = vh - menuRect.height - margin;
    }
    if (top < margin) top = margin;

    menu.style.visibility = 'visible';
    menu.style.top = `${Math.round(top)}px`;
    menu.style.left = `${Math.round(left)}px`;
  }

  function hideMenu(menu) {
    if (!menu) return;
    menu.style.display = 'none';
  }

  // 创建填充图标
  function createFillIcon(input) {
    // disabled/readonly：不加⚡
    if (!isFillableInput(input)) return;

    // 如果已经有图标了，就不重复创建
    if (input.nextElementSibling && input.nextElementSibling.classList.contains('auto-fill-icon')) {
      return;
    }

    const icon = document.createElement('span');
    icon.className = 'auto-fill-icon';
    icon.textContent = CONFIG.iconText;
    icon.title = '点击填充随机内容';

    // 绑定关系：后续变色/状态更新不依赖 DOM 邻接关系
    INPUT_ICON_MAP.set(input, icon);

    // 设置样式
    icon.style.cssText = `
            display: inline-block;
            cursor: pointer;
            color: ${CONFIG.iconColor};
            font-size: ${CONFIG.iconSize};
            margin-left: ${CONFIG.iconMargin};
            padding: 2px 5px;
            border-radius: 3px;
            background-color: rgba(76, 175, 80, 0.1);
            transition: all 0.3s ease;
            vertical-align: middle;
            user-select: none;
        `;

    // 悬停效果
    icon.addEventListener('mouseenter', function() {
      this.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
      this.style.color = CONFIG.iconHoverColor;
    });

    icon.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
      this.style.color = CONFIG.iconColor;
    });

    // hover 显示类型选择；点击沿用“自动/记忆类型”直接填充
    let hoverTimer = null;

    icon.addEventListener('mouseenter', function() {
      hoverTimer = setTimeout(() => {
        showMenu(icon, input);
      }, 150);
    });

    icon.addEventListener('mouseleave', function() {
      if (hoverTimer) clearTimeout(hoverTimer);
      hoverTimer = null;

      // 给用户移动到菜单的时间；若鼠标不在菜单上，则关闭
      const menu = icon._autoFillMenu;
      if (!menu) return;
      setTimeout(() => {
        const isOverMenu = menu.matches(':hover');
        const isOverIcon = icon.matches(':hover');
        if (!isOverMenu && !isOverIcon) hideMenu(menu);
      }, 200);
    });

    // 点击事件 - 默认填充（自动/记忆；支持刷新后从 localStorage 恢复）
    icon.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      let remembered = FIELD_TYPE_MEMORY.get(input);
      if (!remembered) {
        const persisted = loadPersistedFieldType(input);
        if (persisted) {
          remembered = persisted;
          FIELD_TYPE_MEMORY.set(input, remembered);
        }
      }

      fillInput(input, remembered || 'auto');
    });

    // 添加到输入框后面
    if (CONFIG.iconPosition === 'absolute') {
      icon.style.position = 'absolute';
      icon.style.marginLeft = '0';
      input.parentNode.style.position = 'relative';
      input.parentNode.appendChild(icon);
    } else {
      input.parentNode.insertBefore(icon, input.nextSibling);
    }

    // 若该字段已保存过选择类型，则让 icon 变蓝色提示
    updateIconRememberedState(input);
  }

  // 固定位置通知（不做队列/不考虑重叠：新通知覆盖旧通知）
  const NOTIFY_CONTAINER_ID = 'auto-fill-notify-container';

  function ensureNotifyContainer() {
    let c = document.getElementById(NOTIFY_CONTAINER_ID);
    if (c) return c;

    c = document.createElement('div');
    c.id = NOTIFY_CONTAINER_ID;
    c.style.cssText = `
      position: fixed;
      left: 50%;
      top: 14px;
      transform: translateX(-50%);
      z-index: 999999;
      pointer-events: none;
      width: min(560px, calc(100vw - 24px));
      display: block;
    `;
    document.body.appendChild(c);
    return c;
  }

  function ensureNotifyStyleOnce() {
    if (document.getElementById('auto-fill-notify-style')) return;
    const style = document.createElement('style');
    style.id = 'auto-fill-notify-style';
    style.textContent = `
      @keyframes autoFillFadeInTop {
        from { opacity: 0; transform: translateY(-6px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes autoFillFadeOutTop {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  function showToast(message, opts = {}) {
    ensureNotifyStyleOnce();
    const container = ensureNotifyContainer();

    // 不做队列：新 toast 直接覆盖旧 toast（保证固定位置）
    container.innerHTML = '';

    const notification = document.createElement('div');
    notification.className = 'auto-fill-notification';
    notification.textContent = message;

    notification.style.cssText = `
      background-color: #4CAF50;
      color: white;
      padding: 10px 14px;
      border-radius: 10px;
      box-shadow: 0 10px 28px rgba(0,0,0,0.22);
      animation: autoFillFadeInTop 0.18s ease;
      font-size: 14px;
      max-width: 100%;
      word-wrap: break-word;
      text-align: center;
      pointer-events: none;
    `;

    container.appendChild(notification);

    const duration = typeof opts.duration === 'number' ? opts.duration : 1200;
    setTimeout(() => {
      notification.style.animation = 'autoFillFadeOutTop 0.35s ease';
      setTimeout(() => {
        if (notification.parentNode) notification.parentNode.removeChild(notification);
      }, 350);
    }, duration);
  }

  // 显示填充通知
  function showFillNotification(input, oldValue, newValue) {
    if (!CONFIG.showFieldName) return;

    // 批量一键填充时不逐个提示，避免刷屏
    if (IS_BATCH_FILLING) return;

    // 单个点击⚡时的通用提示
    showToast('已填充', { duration: 900 });
  }

  // 检查是否为表单输入框
  function isFormInput(element) {
    const tagName = element.tagName.toLowerCase();
    const inputTypes = ['text', 'email', 'tel', 'number', 'password', 'url', 'search'];

    if (tagName === 'input') {
      return inputTypes.includes(element.type.toLowerCase()) || !element.type;
    }

    return tagName === 'textarea' ||
        tagName === 'select' ||
        (tagName === 'input' && element.type === 'text');
  }

  function isFillableInput(element) {
    if (!element) return false;
    if (!isFormInput(element)) return false;

    // disabled/readonly 不处理：不加⚡，也不一键填充
    if (element.disabled) return false;
    if (element.readOnly) return false;

    return true;
  }

  // 为主页表单添加图标
  function addIconsToForm(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (isFormInput(input)) {
        createFillIcon(input);
      }
    });
  }

  // 扫描整个页面添加图标
  function scanAndAddIcons() {
    // 先扫描所有表单
    const forms = document.querySelectorAll('form');
    forms.forEach(addIconsToForm);

    // 再扫描单独的输入框（不在表单内的）
    const standaloneInputs = document.querySelectorAll(`
            input:not(form input),
            textarea:not(form textarea),
            select:not(form select)
        `);

    standaloneInputs.forEach(input => {
      if (isFormInput(input)) {
        createFillIcon(input);
      }
    });
  }

  // 使用MutationObserver监听动态添加的表单
  function observeDynamicForms() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            if (node.tagName.toLowerCase() === 'form') {
              setTimeout(() => addIconsToForm(node), 100);
            }
            // 检查新增节点中是否包含输入框
            const inputs = node.querySelectorAll ? node.querySelectorAll('input, textarea, select') : [];
            inputs.forEach(input => {
              if (isFormInput(input) && !input.nextElementSibling?.classList.contains('auto-fill-icon')) {
                setTimeout(() => createFillIcon(input), 100);
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 初始化函数
  function init() {
    console.log('表单自动填充脚本已加载');

    // 初始扫描
    scanAndAddIcons();

    // 一键填充按钮（仅填充蓝色⚡字段）
    ensureOneClickFillButton();

    // 监听动态内容
    observeDynamicForms();

    // 添加全局样式
    const style = document.createElement('style');
    style.textContent = `
            .auto-fill-icon:hover {
                transform: scale(1.1);
            }
            .auto-fill-icon:active {
                transform: scale(0.95);
            }
            .auto-fill-type-menu {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
            }
            .auto-fill-icon.auto-fill-icon--remembered {
                color: #1677ff !important;
                background-color: rgba(22, 119, 255, 0.12) !important;
            }
        `;
    document.head.appendChild(style);
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 1000); // 延迟1秒确保页面完全加载
  }

})();
