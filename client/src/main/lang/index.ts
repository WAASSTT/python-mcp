/**
 * 主进程国际化模块
 */

// 自动导入所有语言文件
const allFileList = import.meta.glob("./*", { eager: true });

function getLangAll() {
  const messages: Record<string, any> = {};
  getLangFiles(allFileList, messages);
  return messages;
}

function getLangFiles(
  fileList: Record<string, any>,
  messages: Record<string, any>
) {
  for (const path in fileList) {
    if (fileList[path]?.default) {
      // 提取文件名: './en.ts' -> 'en.ts' -> 'en'
      const fileName = path.substring(path.lastIndexOf("/") + 1);
      const pathName = fileName.replace(/\.(ts|js)$/, "");
      // 跳过 index 文件
      if (pathName !== "index") {
        messages[pathName] = fileList[path].default;
      }
    }
  }
}

// 获取所有语言文件
const messages = getLangAll();

/**
 * 浏览器语言代码映射表
 * 将各种浏览器语言代码标准化为应用支持的语言代码
 * 参照: https://blog.csdn.net/zhenzigis/article/details/129448824
 */
const LOCALE_MAP: Record<string, string> = {
  // ========== 中文 Chinese ==========
  "zh-CN": "zh", // 中文简体
  "zh-SG": "zh-SG", // 马新简体
  "zh-TW": "zh-TW", // 繁体中文(台湾)
  "zh-HK": "zh-TW", // 繁体中文(香港)

  // ========== 英语 English ==========
  en: "en",
  "en-US": "en", // 美国
  "en-EG": "en", // 埃及
  "en-AU": "en", // 澳大利亚
  "en-GB": "en", // 英国
  "en-CA": "en", // 加拿大
  "en-NZ": "en", // 新西兰
  "en-IE": "en", // 爱尔兰
  "en-ZA": "en", // 南非
  "en-JM": "en", // 牙买加
  "en-BZ": "en", // 伯利兹
  "en-TT": "en", // 特立尼达和多巴哥

  // ========== 意大利语 Italian ==========
  it: "it",
  "it-CH": "it", // 瑞士

  // ========== 俄语 Russian ==========
  ru: "ru",
  "ru-MI": "ru",
  "ru-mo": "ru", // 摩尔多瓦共和国

  // ========== 泰语 Thai ==========
  th: "th",

  // ========== 越南语 Vietnamese ==========
  vi: "vi",

  // ========== 日语 Japanese ==========
  ja: "ja",
  "ja-JP": "ja",

  // ========== 韩语 Korean ==========
  ko: "ko",
  "ko-kr": "ko",

  // ========== 德语 German ==========
  de: "de",
  "de-CH": "de", // 瑞士
  "de-AT": "de", // 奥地利
  "de-LU": "de", // 卢森堡
  "de-LI": "de", // 列支敦士登

  // ========== 法语 French ==========
  fr: "fr",
  "fr-BE": "fr", // 比利时
  "fr-CA": "fr", // 加拿大
  "fr-CH": "fr", // 瑞士
  "fr-LU": "fr", // 卢森堡

  // ========== 西班牙语 Spanish ==========
  es: "es",
  "es-AR": "es", // 阿根廷
  "es-GT": "es", // 危地马拉
  "es-CR": "es", // 哥斯达黎加
  "es-PA": "es", // 巴拿马
  "es-DO": "es", // 多米尼加共和国
  "es-MX": "es", // 墨西哥
  "es-VE": "es", // 委内瑞拉
  "es-CO": "es", // 哥伦比亚
  "es-PE": "es", // 秘鲁
  "es-EC": "es", // 厄瓜多尔
  "es-CL": "es", // 智利
  "es-UY": "es", // 乌拉圭
  "es-PY": "es", // 巴拉圭
  "es-BO": "es", // 玻利维亚
  "es-SV": "es", // 萨尔瓦多
  "es-HN": "es", // 洪都拉斯
  "es-NI": "es", // 尼加拉瓜
  "es-PR": "es", // 波多黎各

  // ========== 阿拉伯语 Arabic ==========
  "ar-SA": "ar", // 沙特阿拉伯
  "ar-IQ": "ar", // 伊拉克
  "ar-EG": "ar", // 埃及
  "ar-LY": "ar", // 利比亚
  "ar-DZ": "ar", // 阿尔及利亚
  "ar-MA": "ar", // 摩洛哥
  "ar-TN": "ar", // 突尼斯
  "ar-OM": "ar", // 阿曼
  "ar-YE": "ar", // 也门
  "ar-SY": "ar", // 叙利亚
  "ar-JO": "ar", // 约旦
  "ar-LB": "ar", // 黎巴嫩
  "ar-KW": "ar", // 科威特
  "ar-AE": "ar", // 阿联酋
  "ar-BH": "ar", // 巴林
  "ar-QA": "ar", // 卡塔尔

  // ========== 葡萄牙语 Portuguese ==========
  pt: "pt",
  pt_PT: "pt",
  pt_PT_EURO: "pt",
  "pt-BR": "pt", // 巴西 - 单独一组

  // ========== 罗马尼亚语 Romanian ==========
  ro: "ro",
  "ro-MO": "ro", // 摩尔多瓦共和国

  // ========== 南非荷兰语 Afrikaans ==========
  af: "af",

  // ========== 阿尔巴尼亚语 Albanian ==========
  sq: "sq",
  "sq-AL": "sq",

  // ========== 巴斯克语 Basque ==========
  eu: "eu",

  // ========== 保加利亚语 Bulgarian ==========
  bg: "bg",

  // ========== 白俄罗斯语 Belarusian ==========
  be: "be",

  // ========== 加泰罗尼亚语 Catalan ==========
  ca: "ca",

  // ========== 克罗地亚语 Croatian ==========
  hr: "hr",

  // ========== 捷克语 Czech ==========
  cs: "cs",

  // ========== 丹麦语 Danish ==========
  da: "da",

  // ========== 荷兰语 Dutch ==========
  nl: "nl",
  nl_NL: "nl",
  "nl-BE": "nl", // 比利时

  // ========== 爱沙尼亚语 Estonian ==========
  et: "et",

  // ========== 法罗语 Faroese ==========
  fo: "fo",

  // ========== 波斯语 Persian ==========
  fa: "fa",

  // ========== 芬兰语 Finnish ==========
  fi: "fi",

  // ========== 盖尔语 Gaelic ==========
  gd: "gd", // 苏格兰
  "gd-IE": "gd",

  // ========== 希腊语 Greek ==========
  el: "el",

  // ========== 希伯来语 Hebrew ==========
  he: "he",

  // ========== 印地语 Hindi ==========
  hi: "hi",

  // ========== 匈牙利语 Hungarian ==========
  hu: "hu",

  // ========== 冰岛语 Icelandic ==========
  is: "is",
  is_IS: "is",

  // ========== 印度尼西亚语 Indonesian ==========
  id: "id",

  // ========== 拉脱维亚语 Latvian ==========
  lv: "lv",

  // ========== 立陶宛语 Lithuanian ==========
  lt: "lt",

  // ========== 马其顿语 Macedonian ==========
  mk: "mk",

  // ========== 马尔他语 Maltese ==========
  mt: "mt",

  // ========== 挪威语 Norwegian ==========
  no: "no",
  no_NO: "no",
  no_NO_NY: "no",

  // ========== 波兰语 Polish ==========
  pl: "pl",

  // ========== 里托罗曼斯语 Rhaeto-Romance ==========
  rm: "rm",

  // ========== 萨米语 Sami ==========
  sz: "sz",

  // ========== 塞尔维亚语 Serbian ==========
  sr: "sr",

  // ========== 斯洛伐克语 Slovak ==========
  sk: "sk",

  // ========== 斯洛文尼亚语 Slovenian ==========
  sl: "sl",

  // ========== 索布语 Sorbian ==========
  sb: "sb",

  // ========== 苏图语 Sutu ==========
  sx: "sx",

  // ========== 瑞典语 Swedish ==========
  sv: "sv",
  "sv-FI": "sv", // 瑞典语(芬兰)

  // ========== 特松加语 Tsonga ==========
  ts: "ts",

  // ========== 茨瓦纳语 Tswana ==========
  tn: "tn",

  // ========== 土耳其语 Turkish ==========
  tr: "tr",

  // ========== 乌克兰语 Ukrainian ==========
  uk: "uk",

  // ========== 乌尔都语 Urdu ==========
  ur: "ur",

  // ========== 文达语 Venda ==========
  ve: "ve",

  // ========== 科萨语 Xhosa ==========
  xh: "xh",

  // ========== 意第绪语 Yiddish ==========
  ji: "ji",

  // ========== 祖鲁语 Zulu ==========
  zu: "zu",
};

/**
 * 标准化语言代码
 */
function normalizeLocale(locale: string): string {
  const normalizedLocale = LOCALE_MAP[locale];
  if (normalizedLocale && messages[normalizedLocale]) {
    return normalizedLocale;
  }
  return messages[locale] ? locale : "zh";
}

// 当前语言
let currentLocale = "zh";

/**
 * 设置语言
 */
export function setLocale(locale: string): void {
  currentLocale = normalizeLocale(locale);
}

/**
 * 获取当前语言
 */
export function getLocale(): string {
  return currentLocale;
}

/**
 * 翻译函数
 */
export function t(key: string): string {
  const keys = key.split(".");
  let value: any = messages[currentLocale];

  for (const k of keys) {
    if (value && typeof value === "object") {
      value = value[k];
    } else {
      return key;
    }
  }

  return typeof value === "string" ? value : key;
}
