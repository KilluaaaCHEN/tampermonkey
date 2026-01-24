// ==UserScript==
// @name         表单自动填充助手
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在表单输入框后添加填充图标，支持中文、数字和字母的随机填充
// @author       You
// @match        https://xiaoanuat.annto.com/*
// @match        https://xiaoanuat.annto.com/csp/*
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
    iconMargin: '0px',  // 直接贴紧输入框
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
      // 混合：字母 + 数字 + 常用中文（更像真实输入）
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
          '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严龙飞';
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

      // UI 约定（两态）：
      // - 灰色：未选择过具体类型（含默认/选择 auto 清除）
      // - 绿色：选择过具体类型
      const isTyped = !!(remembered && remembered !== 'auto');

      icon.classList.toggle('auto-fill-icon--typed', isTyped);
      icon.classList.toggle('auto-fill-icon--idle', !isTyped);
    } catch (e) {
      // ignore
    }
  }

  function persistFieldType(input, typeKey) {
    try {
      const key = storageKeyForInput(input);
      if (!key) return;

      // 标记“选择过”（用于灰色态）
      try {
        const icon = INPUT_ICON_MAP.get(input) || input.nextElementSibling;
        if (icon && icon.classList?.contains('auto-fill-icon')) {
          icon.dataset.autoFillEverChosen = '1';
        }
      } catch (e) {}

      if (!typeKey || typeKey === 'auto') {
        // 选择 auto = 清理 v2/v1（如果存在）
        const keyV2 = storageKeyV2ForInput(input);
        const keyV1 = storageKeyV1ForInput(input);
        if (keyV2) localStorage.removeItem(keyV2);
        if (keyV1) localStorage.removeItem(keyV1);

        // 不写入 auto（让它保持“无记忆”），但 UI 进入“灰色选择过(auto)”态
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
    { key: 'number', label: '数字', icon: '🔢' },
    { key: 'letters', label: '字母', icon: '🔤' },
    { key: 'chinese', label: '中文', icon: '🀄️' },
    { key: 'mixed', label: '混合', icon: '🧩' },

    { key: '__sep__' },
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
      case 'chinese':
        return DataGenerator.chinese(6);
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

    // 一些框架（Vue/ElementPlus）需要走原生 setter 才能触发响应式更新
    try {
      const proto = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      if (desc && typeof desc.set === 'function') desc.set.call(input, v);
      else input.value = v;
    } catch (e) {
      input.value = v;
    }

    // ElementPlus 的日期/输入类组件常依赖 compositionend
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: v }));

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));

    return v;
  }

  function fillInput(input, typeKey = 'auto') {
    const oldValue = input.value;

    let content = null;

    // 选择 auto：视为“清除记忆”，需要同步清空 WeakMap + localStorage，并更新 UI
    if (!typeKey || typeKey === 'auto') {
      FIELD_TYPE_MEMORY.delete(input);
      persistFieldType(input, 'auto'); // 内部会清理 localStorage，并把 UI 置灰
      // content 仍走 auto 的生成逻辑
    } else {
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
    // el-select：默认作为“蓝色⚡字段”，参与一键填充（随机选一项）
    if (isElementPlusSelectInput(input)) return true;

    const remembered = getRememberedTypeKey(input);
    return !!(remembered && remembered !== 'auto');
  }

  let IS_BATCH_FILLING = false;

  function isMerchantSwitchElSelectInput(input) {
    // 规则：页面第一个 el-select 是“切换商户”，不显示⚡，也不参与自动随机选择
    try {
      if (!isElementPlusSelectInput(input)) return false;
      const all = Array.from(document.querySelectorAll('input.el-select__input, input[role="combobox"]'));
      const idx = all.indexOf(input);
      return idx === 0;
    } catch (e) {
      return false;
    }
  }

  async function fillAllRememberedFields() {
    // 一键填充顺序要求：先填充 input/textarea，再处理 select（el-select 下拉随机选）
    //
    // 注意：某些页面在表单 change/校验 后会自动提交/触发刷新。
    // 因此这里做“节流 + 逐项延迟”，降低连续触发事件导致的意外刷新概率。
    let filled = 0;

    IS_BATCH_FILLING = true;
    try {
      // 只在“当前最高层可见弹窗/对话框”内一键填充；
      // 若页面打开了弹窗表单，就不要去填充被遮罩覆盖的页面底层表单。
      const getActiveRoot = () => {
        // 仅当存在“确实打开的弹窗内容”时，才把 root 限制在弹窗里；
        // 否则用 document，避免误命中常驻 overlay（导致一个都填不进去）。
        const dialogContents = Array.from(document.querySelectorAll('.el-dialog__body, .el-drawer__body, .el-message-box__content')).filter(isElementVisible);
        if (dialogContents.length > 0) {
          // 取最后一个可见的（最上层）
          return dialogContents[dialogContents.length - 1];
        }

        // 某些版本只有 wrapper：尝试找“可见且内部有 input”的 wrapper
        const wrappers = Array.from(document.querySelectorAll('.el-dialog__wrapper, .el-drawer__wrapper')).filter(isElementVisible);
        for (let i = wrappers.length - 1; i >= 0; i--) {
          const w = wrappers[i];
          if (w.querySelector('input, textarea, select')) return w;
        }

        return document;
      };

      const root = getActiveRoot();

      const all = Array.from(root.querySelectorAll('input, textarea, select'));

      const normalInputs = all.filter((el) => {
        if (!(el instanceof HTMLElement)) return false;
        // 排除 el-select 的 input（readonly/combobox），它属于“select 阶段”
        if (isElementPlusSelectInput(el)) return false;
        // 必须是表单内且会创建⚡（没有⚡的一律不参与一键填充）
        if (!shouldCreateIconForInput(el)) return false;
        // 仅处理可填充输入框，且必须是“记忆字段”
        if (!isFillableInput(el)) return false;
        const typeKey = getRememberedTypeKey(el);
        return !!(typeKey && typeKey !== 'auto');
      });

      const elSelectInputs = all.filter((el) => {
        if (!(el instanceof HTMLElement)) return false;
        if (!isElementPlusSelectInput(el)) return false;
        // 必须是表单内且会创建⚡（没有⚡的一律不参与一键填充）
        if (!shouldCreateIconForInput(el)) return false;
        if (el.disabled) return false;
        // 切换商户下拉不显示⚡，也不参与一键填充
        if (isMerchantSwitchElSelectInput(el)) return false;
        return true;
      });

      const isActuallyVisibleInput = (el) => {
        try {
          if (!el || !el.isConnected) return false;
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return false;
          if (!isElementVisible(el)) return false;

          // 在弹窗 root 内时，严格 elementFromPoint 容易误判（命中到 wrapper/slot/遮罩层）
          // 这里放宽：只要 input 自己可见、且不在屏幕外，就认为可填充
          // （root 已经限制在弹窗内容里了，因此不会误填充底层页面）
          if (rect.bottom < 0 || rect.top > window.innerHeight) return false;

          return true;
        } catch (e) {
          return true;
        }
      };

      // 1) 先填充普通输入框
      for (const input of normalInputs) {
        if (document.visibilityState === 'hidden') break;

        // 如果该元素被遮罩/弹窗覆盖（不可交互），就跳过
        if (!isActuallyVisibleInput(input)) continue;

        const typeKey = getRememberedTypeKey(input);
        if (!typeKey || typeKey === 'auto') continue;

        fillInput(input, typeKey);
        filled++;

        // 日期/联动校验类字段，给一点时间让组件更新内部状态，否则下一个字段可能被覆盖/回滚
        await sleep(60);
      }

      // 2) 再处理下拉（el-select 随机选）
      for (const input of elSelectInputs) {
        await sleep(200);
        if (document.visibilityState === 'hidden') break;

        if (!isActuallyVisibleInput(input)) continue;

        const ok = await randomPickFromElSelectInput(input);
        if (ok) filled++;

        await sleep(120);
      }
    } finally {
      IS_BATCH_FILLING = false;
    }

    // 一键填充只提示一次（不刷屏）
    showToast(filled > 0 ? `已一键填充 ${filled} 项` : '没有可一键填充的字段', { duration: 1400 });
  }

  // ⚡隐藏/显示：不做持久化，每次刷新默认显示
  let LIGHTNING_HIDDEN = false;

  function isLightningHidden() {
    return LIGHTNING_HIDDEN;
  }

  function setLightningHidden(hidden) {
    LIGHTNING_HIDDEN = !!hidden;
  }

  function applyLightningHiddenState() {
    const hidden = isLightningHidden();
    const display = hidden ? 'none' : '';

    // 1) ⚡本身（输入框右侧）
    document.querySelectorAll('.auto-fill-icon').forEach((el) => {
      el.style.display = display;
    });

    // 2) 如果有打开的菜单，也一并隐藏
    document.querySelectorAll('.auto-fill-type-menu').forEach((el) => {
      el.style.display = hidden ? 'none' : el.style.display;
    });

    // 3) 顶部两个按钮（“一键填充”、“隐藏⚡”）：隐藏时都隐藏，显示时恢复
    const oneClickBtn = document.getElementById('auto-fill-one-click');
    if (oneClickBtn) oneClickBtn.style.display = hidden ? 'none' : '';

    // 4) “隐藏⚡”按钮：隐藏态变为小 icon；显示态恢复为正常按钮
    const toggleBtn = document.getElementById('auto-fill-toggle-lightning');
    if (toggleBtn) {
      toggleBtn.dataset.hidden = hidden ? '1' : '0';

      if (hidden) {
        toggleBtn.textContent = '⚡';
        toggleBtn.title = '显示所有输入框后的⚡填充按钮';

        toggleBtn.style.padding = '8px';
        toggleBtn.style.width = '36px';
        toggleBtn.style.height = '36px';
        toggleBtn.style.borderRadius = '18px';
        toggleBtn.style.display = 'inline-flex';
        toggleBtn.style.alignItems = 'center';
        toggleBtn.style.justifyContent = 'center';
        toggleBtn.style.fontSize = '16px';
        toggleBtn.style.letterSpacing = '0';

        toggleBtn.style.background = 'linear-gradient(135deg, #ff7a45, #ffa940)';
        toggleBtn.style.boxShadow = '0 10px 26px rgba(255,122,69,0.28)';
      } else {
        toggleBtn.textContent = '隐藏⚡';
        toggleBtn.title = '隐藏所有输入框后的⚡填充按钮';

        // 恢复按钮大小（与创建时一致）
        toggleBtn.style.padding = '10px 16px';
        toggleBtn.style.width = '';
        toggleBtn.style.height = '';
        toggleBtn.style.borderRadius = '12px';
        toggleBtn.style.display = '';
        toggleBtn.style.alignItems = '';
        toggleBtn.style.justifyContent = '';
        toggleBtn.style.fontSize = '14px';
        toggleBtn.style.letterSpacing = '0.5px';

        toggleBtn.style.background = 'linear-gradient(135deg, #1677ff, #69b1ff)';
        toggleBtn.style.boxShadow = '0 10px 26px rgba(22,119,255,0.28)';
      }
    }
  }

  function ensureToggleLightningButton() {
    if (document.getElementById('auto-fill-toggle-lightning')) return;

    const btn = document.createElement('button');
    btn.id = 'auto-fill-toggle-lightning';
    btn.type = 'button';
    btn.textContent = '隐藏⚡';
    btn.title = '隐藏所有输入框后的⚡填充按钮';
    btn.style.cssText = `
      position: fixed;
      right: 16px;
      top: 120px;
      z-index: 999999;
      background: linear-gradient(135deg, #ff7a45, #ffa940);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.35);
      border-radius: 12px;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      box-shadow: 0 10px 26px rgba(255,122,69,0.28);
      user-select: none;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-1px)';
      btn.style.boxShadow = '0 12px 30px rgba(255,122,69,0.34)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'none';
      btn.style.boxShadow = '0 10px 26px rgba(255,122,69,0.28)';
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const nextHidden = !isLightningHidden();
      setLightningHidden(nextHidden);
      applyLightningHiddenState();
      showToast(nextHidden ? '已隐藏⚡' : '已显示⚡', { duration: 900 });
    });

    document.body.appendChild(btn);

    // 初始化一次状态（默认显示⚡；不从任何存储恢复）
    setLightningHidden(false);
    applyLightningHiddenState();
  }

  let ONE_CLICK_FILLING = false;

  function ensureOneClickFillButton() {
    if (document.getElementById('auto-fill-one-click')) return;

    const btn = document.createElement('button');
    btn.id = 'auto-fill-one-click';
    btn.type = 'button';
    btn.textContent = '一键填充';
    btn.title = '仅填充已选择过类型（蓝色⚡）的字段（包含下拉随机选项）';
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

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // 防止连点导致事件堆叠（有些页面会因此触发提交/刷新）
      if (ONE_CLICK_FILLING) return;
      ONE_CLICK_FILLING = true;

      const oldText = btn.textContent;
      btn.textContent = '填充中...';
      btn.style.opacity = '0.85';
      btn.style.cursor = 'not-allowed';

      try {
        await fillAllRememberedFields();
      } finally {
        ONE_CLICK_FILLING = false;
        btn.textContent = oldText;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }
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

        // 只要点过菜单，就算“选择过”
        try {
          icon.dataset.autoFillEverChosen = '1';
        } catch (err) {}

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

    // 左右边界处理：优先把菜单放到⚡的右侧，避免遮挡按钮本身
    let left = rect.right + 10;

    // 如果右侧空间不足，再退回到 icon 左侧（原逻辑）
    if (left + menuRect.width + margin > vw) {
      left = rect.left - menuRect.width - 10;
    }

    // 仍然不够则贴右边界
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
  // ===== ElementPlus el-select 随机选择（行政区等下拉） =====
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function getElSelectWrapByInput(input) {
    // input 在 ElementPlus 里通常被包在 .el-select 中，弹层挂在 body
    return input?.closest?.('.el-select') || null;
  }

  function getElSelectTriggerByInput(input) {
    const wrap = getElSelectWrapByInput(input);
    if (!wrap) return null;
    return wrap.querySelector('.el-select__wrapper') || wrap;
  }

  function findNewestVisibleDropdown() {
    // ElementPlus: el-select-dropdown / el-popper / el-tooltip 组合很多版本差异
    const candidates = Array.from(document.querySelectorAll('.el-select__popper, .el-popper, .el-select-dropdown'));
    // 取最后一个“可见”的（最近打开的通常在后面）
    for (let i = candidates.length - 1; i >= 0; i--) {
      const el = candidates[i];
      if (isElementVisible(el) && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0) return el;
    }
    return null;
  }

  function getSelectableOptionEls(dropdown) {
    if (!dropdown) return [];
    // 兼容 ElementPlus：.el-select-dropdown__item / li[role=option] / .el-vl__window 下的 item
    const options = Array.from(dropdown.querySelectorAll('.el-select-dropdown__item, li[role="option"], .el-select-dropdown__item span'));
    // 如果命中的是 span，则回到 item
    const normalized = options.map(el => el.closest?.('.el-select-dropdown__item') || el.closest?.('li[role="option"]') || el).filter(Boolean);

    // 去重
    const uniq = [];
    const seen = new Set();
    normalized.forEach(el => {
      if (seen.has(el)) return;
      seen.add(el);
      uniq.push(el);
    });

    // 过滤禁用/不可选/空
    return uniq.filter(el => {
      if (!isElementVisible(el)) return false;
      const cls = (el.className || '').toString();
      if (cls.includes('is-disabled') || cls.includes('disabled')) return false;
      const ariaDisabled = el.getAttribute?.('aria-disabled');
      if (ariaDisabled === 'true') return false;
      const text = (el.innerText || el.textContent || '').trim();
      if (!text) return false;
      return true;
    });
  }

  async function waitForOptionsLoaded({ timeoutMs = 6000, stepMs = 120 } = {}) {
    const start = Date.now();
    let lastCount = -1;
    let stableTicks = 0;

    while (Date.now() - start < timeoutMs) {
      const dropdown = findNewestVisibleDropdown();
      const opts = getSelectableOptionEls(dropdown);

      // 处理“懒加载/滚动加载”：当数量稳定 2 个 tick 就认为已加载完成
      if (opts.length === lastCount) stableTicks++;
      else stableTicks = 0;

      lastCount = opts.length;

      if (opts.length > 0 && stableTicks >= 2) return { dropdown, options: opts };

      // 尝试触发一次滚动加载（很多 el-select 用虚拟列表）
      if (dropdown) {
        const scroller =
            dropdown.querySelector('.el-scrollbar__wrap') ||
            dropdown.querySelector('.el-select-dropdown__wrap') ||
            dropdown.querySelector('[class*="scrollbar"]') ||
            dropdown;
        try { scroller.scrollTop = scroller.scrollHeight; } catch (e) {}
      }

      await sleep(stepMs);
    }

    // 超时也返回当前结果，给上层兜底
    const dropdown = findNewestVisibleDropdown();
    return { dropdown, options: getSelectableOptionEls(dropdown) };
  }

  async function randomPickFromElSelectInput(input) {
    const trigger = getElSelectTriggerByInput(input);
    if (!trigger) return false;

    // 1) 打开下拉
    trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await sleep(50);

    // 2) 等待选项渲染/懒加载完成
    const { dropdown, options } = await waitForOptionsLoaded({ timeoutMs: 8000 });

    if (!options || options.length === 0) {
      // 关闭（尽量不干扰）
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return false;
    }

    // 3) 随机选择
    const idx = Math.floor(Math.random() * options.length);
    const opt = options[idx];

    opt.scrollIntoView?.({ block: 'nearest' });
    opt.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    opt.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    opt.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    return true;
  }

  function isElementPlusSelectInput(input) {
    // 你的示例是：input.el-select__input (readonly) + 外层 .el-select
    if (!input) return false;
    if (input.tagName?.toLowerCase() !== 'input') return false;
    const cls = (input.className || '').toString();
    if (cls.includes('el-select__input')) return true;
    // 有些版本 input class 不同，但在 .el-select 里且 readonly/role=combobox
    const inSelect = !!input.closest?.('.el-select');
    const role = input.getAttribute?.('role');
    if (inSelect && role === 'combobox') return true;
    return false;
  }

  // 拦截用户“直接点击下拉”行为：页面刷新后也生效
  function bindElSelectAutoRandomPick() {
    if (window.__AUTO_FILL_EL_SELECT_BOUND__) return;
    window.__AUTO_FILL_EL_SELECT_BOUND__ = true;

    // capture 阶段拦截，尽量早于组件自身处理
    document.addEventListener('click', async (e) => {
      const target = e.target;
      const input = target?.closest?.('input') || (target?.tagName?.toLowerCase() === 'input' ? target : null);
      if (!input) return;
      if (!isElementPlusSelectInput(input)) return;

      // 切换商户下拉：不做自动随机选择（也不会显示⚡）
      if (isMerchantSwitchElSelectInput(input)) return;

      // 只对“尚未有值”的下拉做自动随机，避免覆盖用户已选内容
      const wrap = getElSelectWrapByInput(input);
      const hasValue = !!wrap?.querySelector?.('.el-select__selected-item:not(.el-select__placeholder)') ||
          !!wrap?.querySelector?.('.el-select__selection .el-select__selected-item:not(.el-select__placeholder):not(.is-transparent)');
      if (hasValue) return;

      // 防止组件默认 click 再次触发造成状态抖动
      e.preventDefault();
      e.stopPropagation();

      const ok = await randomPickFromElSelectInput(input);
      if (ok) showToast('已随机选择一项', { duration: 900 });
    }, true);
  }

  function getElSelectIconMountNodeByInput(input) {
    // ElementPlus: input 常常是隐藏的，插在 input 后面会“看不见”
    // 这里优先把⚡挂到 .el-select__wrapper/.el-input__wrapper 上（可见区域）
    const wrap = getElSelectWrapByInput(input);
    if (!wrap) return null;

    return wrap.querySelector('.el-select__wrapper')
        || wrap.querySelector('.el-input__wrapper')
        || wrap;
  }

  function hasExistingAutoFillIconNear(input) {
    // 现在⚡可能被挂在：
    // - ElementUI/ElementPlus 的 .el-input__suffix-inner 内
    // - textarea 父容器内（absolute）
    // - el-select wrapper 内
    // 因此需要更稳健的“是否已存在”判断，避免 MutationObserver 重复插入导致多个⚡。
    try {
      // 1) input 后紧邻（历史逻辑）
      if (input.nextElementSibling && input.nextElementSibling.classList?.contains('auto-fill-icon')) return true;

      // 2) ElementUI/ElementPlus：在同一个 .el-input 容器内是否已有⚡
      const elInputWrap = input.closest?.('.el-input');
      if (elInputWrap && elInputWrap.querySelector?.('.auto-fill-icon')) return true;

      // 3) textarea：父容器内是否已有⚡
      if ((input.tagName || '').toLowerCase() === 'textarea') {
        const wrap = input.parentElement;
        if (wrap && wrap.querySelector?.(':scope > .auto-fill-icon, .auto-fill-icon')) return true;
      }

      // 4) el-select：wrapper 内已存在（避免重复插入）
      const mount = getElSelectIconMountNodeByInput(input);
      if (mount && mount.querySelector?.(':scope > .auto-fill-icon, .auto-fill-icon')) return true;
    } catch (e) {
      // ignore
    }

    return false;
  }

  function isInFormContext(input) {
    // 只有“表单区域”才需要⚡：避免列表筛选/分页(例如 20条/页)也出现⚡
    // 以 form / el-form / el-form-item 作为表单上下文判断
    //
    // 新站点（/csp）部分页面表单并不在 <form> 内，且不一定使用 ElementPlus 的 el-form 组件，
    // 但会存在 .el-form-item / .el-input 等结构，因此这里放宽：
    // - 仍优先要求在明确表单容器内
    // - 若在 ElementPlus 输入组件内，也视为“表单上下文”
    try {
      return !!(
          input.closest?.('form') ||
          input.closest?.('.el-form') ||
          input.closest?.('.el-form-item') ||
          input.closest?.('.el-input') ||
          input.closest?.('.el-textarea')
      );
    } catch (e) {
      return false;
    }
  }

  function shouldCreateIconForInput(input) {
    // 只在表单上下文内创建⚡
    if (!isInFormContext(input)) return false;

    // 对于 el-select：readonly 是正常情况，但“切换商户”第一个下拉不显示⚡
    if (isElementPlusSelectInput(input)) {
      if (input.disabled) return false;
      if (isMerchantSwitchElSelectInput(input)) return false;
      return true;
    }
    // 普通输入：沿用原规则（readonly/disabled 不加⚡）
    return isFillableInput(input);
  }

  function createFillIcon(input) {
    // 普通 input：disabled/readonly 不加⚡；但 el-select 的 readonly 是正常的，需要允许
    if (!shouldCreateIconForInput(input)) return;

    // 如果已经有图标了，就不重复创建
    if (hasExistingAutoFillIconNear(input)) {
      return;
    }

    const icon = document.createElement('span');
    icon.className = 'auto-fill-icon';
    icon.textContent = CONFIG.iconText;
    icon.title = '点击填充随机内容';

    // 绑定关系：后续变色/状态更新不依赖 DOM 邻接关系
    INPUT_ICON_MAP.set(input, icon);

    // 设置样式：
    // 需求：⚡不要插到 input 外面（变成一个独立元素把布局顶开），而是作为“输入框最右侧”。
    // 适配策略：
    // - ElementUI/ElementPlus：把⚡作为 suffix（right addon）插入到 .el-input 结构内
    // - textarea：通过 wrapper relative + icon absolute 贴到右侧内部
    const isTextArea = (input.tagName || '').toLowerCase() === 'textarea';

    // 通用 icon 样式（两种挂载方式会补充定位样式）
    // 需求：尽量“窄”，并贴近输入框右侧
    icon.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: ${CONFIG.iconColor};
            font-size: ${CONFIG.iconSize};
            border-radius: 3px;
            background-color: rgba(76, 175, 80, 0.1);
            transition: all 0.3s ease;
            user-select: none;
            white-space: nowrap;
            flex: 0 0 auto;
            padding: 0;
            width: 16px;
            min-width: 16px;
            height: 27px;
            line-height: 27px;
            margin-right: -4px;
            margin-top: 0px;
            text-align: center;
        `;

    // 1) textarea：贴到 textarea 右侧内部（不改变原布局宽度）
    if (isTextArea) {
      try {
        const wrap = input.parentElement;
        if (wrap) {
          const wrapStyle = window.getComputedStyle(wrap);
          if (wrapStyle.position === 'static') wrap.style.position = 'relative';

          // 给 textarea 预留右侧空间，避免文字被⚡遮住
          const oldPaddingRight = parseFloat(window.getComputedStyle(input).paddingRight || '0') || 0;
          if (oldPaddingRight < 26) input.style.paddingRight = `${Math.max(oldPaddingRight, 26)}px`;

          icon.style.position = 'absolute';
          icon.style.right = '4px';
          icon.style.top = '6px';
          icon.style.zIndex = '2';
          icon.style.padding = '0';
          icon.style.width = '16px';
          icon.style.minWidth = '16px';
          icon.style.height = '27px';
          icon.style.lineHeight = '27px';
          icon.style.marginRight = '-4px';
          icon.style.marginTop = '0px';

          wrap.appendChild(icon);
        } else {
          input.parentNode.insertBefore(icon, input.nextSibling);
        }
      } catch (e) {
        input.parentNode.insertBefore(icon, input.nextSibling);
      }
    } else {
      // 2) input：优先走 ElementUI/ElementPlus 的 suffix 结构
      let mounted = false;

      // ElementUI/ElementPlus el-input 结构：input.el-input__inner + span.el-input__suffix
      try {
        const elInputWrap = input.closest?.('.el-input');
        if (elInputWrap) {
          // 只影响当前容器，保证 suffix 与 input 同一行且不会换行
          elInputWrap.style.display = 'flex';
          elInputWrap.style.alignItems = 'center';
          elInputWrap.style.flexWrap = 'nowrap';

          // input 需要可收缩（否则 suffix 会被挤到下一行）
          const inner = elInputWrap.querySelector?.('.el-input__inner');
          if (inner) {
            inner.style.flex = '1 1 auto';
            inner.style.minWidth = '0';
            // 预留右侧空间避免遮挡（suffix 方式一般不需要，但旧结构可能会叠加）
            const pr = parseFloat(window.getComputedStyle(inner).paddingRight || '0') || 0;
            if (pr < 28) inner.style.paddingRight = `${Math.max(pr, 28)}px`;
          }

          // suffix 容器：若没有则创建
          let suffix = elInputWrap.querySelector('.el-input__suffix');
          if (!suffix) {
            suffix = document.createElement('span');
            suffix.className = 'el-input__suffix';
            elInputWrap.appendChild(suffix);
          }

          // suffix-inner：若没有则创建
          let suffixInner = suffix.querySelector('.el-input__suffix-inner');
          if (!suffixInner) {
            suffixInner = document.createElement('span');
            suffixInner.className = 'el-input__suffix-inner';
            suffix.appendChild(suffixInner);
          }

          // icon 作为 suffix 的最右侧内容（紧贴右侧，避免“悬空”）
          // 让 suffix 容器成为 flex，并清理可能的内边距/间距
          try {
            suffix.style.display = 'flex';
            suffix.style.alignItems = 'center';
            suffix.style.marginLeft = '0';
            suffix.style.paddingLeft = '0';
            suffix.style.paddingRight = '0';
          } catch (e) {}

          try {
            suffixInner.style.display = 'flex';
            suffixInner.style.alignItems = 'center';
            suffixInner.style.gap = '0';
            suffixInner.style.marginLeft = '0';
            suffixInner.style.paddingLeft = '0';
            suffixInner.style.paddingRight = '0';
          } catch (e) {}

          // 贴合到最右侧：取消多余 padding，保持一个字符宽度
          icon.style.marginLeft = '0';
          icon.style.marginRight = '-4px';
          icon.style.marginTop = '0px';
          icon.style.padding = '0';
          icon.style.width = '16px';
          icon.style.minWidth = '16px';
          icon.style.height = '27px';
          icon.style.lineHeight = '27px';

          // suffix-inner 末尾追加，并让 suffix 右侧不留空
          try { suffix.style.paddingRight = '0'; } catch (e) {}
          try { suffixInner.style.paddingRight = '0'; } catch (e) {}

          suffixInner.appendChild(icon);
          mounted = true;
        }
      } catch (e) {}

      if (!mounted) {
        // fallback：如果不是 ElementUI/ElementPlus 结构，就还是插在 input 后面（尽量不破）
        // 但用 absolute 贴到右侧内部，避免挤占布局
        try {
          const wrap = input.parentElement;
          if (wrap) {
            const wrapStyle = window.getComputedStyle(wrap);
            if (wrapStyle.position === 'static') wrap.style.position = 'relative';

            const oldPaddingRight = parseFloat(window.getComputedStyle(input).paddingRight || '0') || 0;
            if (oldPaddingRight < 26) input.style.paddingRight = `${Math.max(oldPaddingRight, 26)}px`;

            icon.style.position = 'absolute';
            icon.style.right = '4px';
            icon.style.top = '50%';
            icon.style.transform = 'translateY(-50%)';
            icon.style.zIndex = '2';
            icon.style.padding = '0';
            icon.style.width = '16px';
            icon.style.minWidth = '16px';
            icon.style.height = '27px';
            icon.style.lineHeight = '27px';
            icon.style.marginRight = '-4px';
            icon.style.marginTop = '0px';

            wrap.appendChild(icon);
          } else {
            input.parentNode.insertBefore(icon, input.nextSibling);
          }
        } catch (e) {
          input.parentNode.insertBefore(icon, input.nextSibling);
        }
      }
    }

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

    // 初始化 UI 状态：首次创建为默认态
    icon.dataset.autoFillEverChosen = icon.dataset.autoFillEverChosen || '0';

    icon.addEventListener('mouseenter', function() {
      // el-select 下拉：不显示“类型选择菜单”，只保留点击随机选择
      if (isElementPlusSelectInput(input)) return;

      hoverTimer = setTimeout(() => {
        showMenu(icon, input);
      }, 150);
    });

    icon.addEventListener('mouseleave', function() {
      if (hoverTimer) clearTimeout(hoverTimer);
      hoverTimer = null;

      // el-select 下拉：不显示类型菜单
      if (isElementPlusSelectInput(input)) return;

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
    icon.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();

      // ElementPlus el-select：点击⚡时随机选择一项（行政区等）
      // 注：切换商户下拉不会生成⚡，因此这里无需单独判断
      if (isElementPlusSelectInput(input)) {
        const ok = await randomPickFromElSelectInput(input);
        if (ok) showToast('已随机选择一项', { duration: 900 });
        else showToast('下拉暂无可选项', { duration: 900 });
        return;
      }

      let remembered = FIELD_TYPE_MEMORY.get(input);
      if (!remembered) {
        const persisted = loadPersistedFieldType(input);
        if (persisted) {
          remembered = persisted;
          FIELD_TYPE_MEMORY.set(input, remembered);
        }
      }

      // 若用户选择过 auto（灰色态），则点击⚡按 auto 随机填充，而不是沿用旧类型
      const iconStateChosenAuto = icon.dataset.autoFillEverChosen === '1' && (!remembered || remembered === 'auto');
      fillInput(input, iconStateChosenAuto ? 'auto' : (remembered || 'auto'));
    });

    // 若该字段已保存过选择类型，则让 icon 变蓝色提示
    updateIconRememberedState(input);

    // 若当前处于“隐藏⚡”状态，则新创建的 icon 也应隐藏
    if (isLightningHidden()) {
      icon.style.display = 'none';
    }
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
    // 这里不能用 isFormInput 过滤：el-select 的 input 是 readonly/特殊结构
    // 统一直接交给 createFillIcon 做判断
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      createFillIcon(input);
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
      createFillIcon(input);
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
              // 交给 createFillIcon 判断；并用更宽松的“附近是否已有 icon”避免重复
              if (!hasExistingAutoFillIconNear(input)) {
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

    // ElementPlus el-select：直接点击下拉时自动随机选择（刷新后也生效）
    bindElSelectAutoRandomPick();

    // 一键填充按钮（仅填充蓝色⚡字段）
    ensureOneClickFillButton();

    // 一键隐藏/显示 ⚡ 按钮
    ensureToggleLightningButton();

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
            /* ===== ⚡ UI 状态（两态）=====
             * 灰色：未选择过具体类型（含默认/选择auto清除）
             * 绿色：选择过具体类型
             */
            .auto-fill-icon.auto-fill-icon--idle {
                color: #9aa0a6 !important;
                background-color: rgba(154, 160, 166, 0.18) !important;
            }
            .auto-fill-icon.auto-fill-icon--typed {
                color: #1B5E20 !important;
                background-color: rgba(76, 175, 80, 0.18) !important;
                box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.25);
                font-weight: 900;
            }

            /* ElementPlus wrapper 常用 flex，避免⚡被压缩/换行 */
            .el-select__wrapper .auto-fill-icon,
            .el-input__wrapper .auto-fill-icon {
                flex: 0 0 auto;
                align-self: center;
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
