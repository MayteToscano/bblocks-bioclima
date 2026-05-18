/*
 * BioClima viewer - UI translations.
 * The data labels themselves come from the ontology, not from this file.
 */
window.UI_STRINGS = {
  en: {
    subtitle: "OGC Building Blocks viewer",
    language: "Language",
    layers:   "Layers",
    time:     "Time",
    legend:   "Legend",
    policy:   "Policy alignment",
    footer:   "Register: ",
    value:    "Value",
    unit:     "Unit",
    cell:     "Cell",
    pci:      "PCI",
    category: "Category",
    noData:   "No data at this location",
    block:    "Block:",
    attributes: "Attributes",
    attributesHint: "Click an attribute name to open its definition in the ontology.",
    relationship: "relationship",
    evidenceStrength: "evidence",
    openRegistry: "Open registry index",
    openBblockViewer: "Block documentation (official viewer)",
    bioclimaPartners: "BioClima partners",
    parameter: "Parameter",
    indicator: "Indicator"
  },
  es: {
    subtitle: "Visor de bloques OGC",
    language: "Idioma",
    layers:   "Capas",
    time:     "Tiempo",
    legend:   "Leyenda",
    policy:   "Alineación con políticas",
    footer:   "Registro: ",
    value:    "Valor",
    unit:     "Unidad",
    cell:     "Celda",
    pci:      "PCI",
    category: "Categoría",
    noData:   "Sin datos en este punto",
    block:    "Bloque:",
    attributes: "Atributos",
    attributesHint: "Haz clic en el nombre de un atributo para abrir su definición en la ontología.",
    relationship: "relación",
    evidenceStrength: "evidencia",
    openRegistry: "Abrir índice del registro",
    openBblockViewer: "Documentación del bloque (visor oficial)",
    bioclimaPartners: "Socios de BioClima",
    parameter: "Parámetro",
    indicator: "Indicador"
  },
  zh: {
    subtitle: "OGC 构建块查看器",
    language: "语言",
    layers:   "图层",
    time:     "时间",
    legend:   "图例",
    policy:   "政策对齐",
    footer:   "注册表:",
    value:    "数值",
    unit:     "单位",
    cell:     "单元",
    pci:      "PCI",
    category: "类别",
    noData:   "此位置无数据",
    block:    "构建块:",
    attributes: "属性",
    attributesHint: "点击属性名以在本体中打开其定义。",
    relationship: "关系",
    evidenceStrength: "证据",
    openRegistry: "打开注册表索引",
    openBblockViewer: "构建块文档(官方查看器)",
    bioclimaPartners: "BioClima 合作伙伴",
    parameter: "参数",
    indicator: "指标"
  },
  ro: {
    subtitle: "Vizualizator OGC Building Blocks",
    language: "Limbă",
    layers:   "Straturi",
    time:     "Timp",
    legend:   "Legendă",
    policy:   "Alinierea cu politici",
    footer:   "Registru: ",
    value:    "Valoare",
    unit:     "Unitate",
    cell:     "Celulă",
    pci:      "PCI",
    category: "Categorie",
    noData:   "Nu există date în această locație",
    block:    "Bloc:",
    attributes: "Atribute",
    attributesHint: "Faceți clic pe numele unui atribut pentru a-i deschide definiția în ontologie.",
    relationship: "relație",
    evidenceStrength: "evidență",
    openRegistry: "Deschide indexul registrului",
    openBblockViewer: "Documentația blocului (vizualizator oficial)",
    bioclimaPartners: "Parteneri BioClima",
    parameter: "Parametru",
    indicator: "Indicator"
  }
};

window.applyTranslations = function (lang) {
  const dict = window.UI_STRINGS[lang] || window.UI_STRINGS.en;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
};
