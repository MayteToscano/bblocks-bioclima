window.BIOCLIMA_PORTAL = {
  labels: {
    en: {
      results: "results",
      noResults: "No results match the current search.",
      sortBy: "Sort by",
      relevance: "Relevance",
      expandAll: "Expand all",
      variable: "Variable",
      year: "Year",
      loading: "Loading layer…",
      ready: "Layer ready",
      noData: "No data",
      value: "Value",
      unit: "Unit",
      cell: "Cell",
      block: "Block",
      ontologyClass: "Ontology Class",
      definition: "Definition",
      preferredLabel: "Preferred Label",
      synonym: "Synonym",
      relatedClasses: "Related Classes",
      semanticRelations: "Semantic Relations",
      linksToBlocks: "Links to Blocks"
    },
    es: {
      results: "resultados",
      noResults: "No hay resultados para la búsqueda actual.",
      sortBy: "Ordenar por",
      relevance: "Relevancia",
      expandAll: "Expandir todo",
      variable: "Variable",
      year: "Año",
      loading: "Cargando capa…",
      ready: "Capa lista",
      noData: "Sin datos",
      value: "Valor",
      unit: "Unidad",
      cell: "Celda",
      block: "Bloque",
      ontologyClass: "Clase de ontología",
      definition: "Definición",
      preferredLabel: "Etiqueta preferente",
      synonym: "Sinónimo",
      relatedClasses: "Clases relacionadas",
      semanticRelations: "Relaciones semánticas",
      linksToBlocks: "Enlaces a bloques"
    }
  },
  filters: [
    { key: "ebv", label: "EBV", icon: "🌿" },
    { key: "ecv", label: "ECV", icon: "〰️" },
    { key: "indicator", label: "Indicator", icon: "▥" },
    { key: "coveragejson", label: "CoverageJSON", icon: "⬡" },
    { key: "ontology", label: "Ontology", icon: "⌘" },
    { key: "provenance", label: "Provenance", icon: "◇" },
    { key: "policy", label: "Policy", icon: "◈" },
    { key: "zoning", label: "Zoning", icon: "▧" }
  ],
  catalog: [
    {
      id: "ecosystem-phenology",
      type: "ebv",
      icon: "🌿",
      title: { en: "Ecosystem Phenology", es: "Fenología del ecosistema" },
      description: {
        en: "The timing of recurrent biological events in ecosystems.",
        es: "La temporalidad de eventos biológicos recurrentes en los ecosistemas."
      },
      scope: "Global",
      layerId: "vap-coniferous",
      bblock: "ogc.bioclima.ebv.ebv-definition",
      blockUrl: "../bblocks/bblock/ogc.bioclima.ebv.ebv-definition",
      metadata: {
        identifier: "bc-ebv-phenology",
        version: "1.0.0",
        publisher: "BioClima Consortium",
        license: "CC BY 4.0",
        spatialResolution: "0.05° (~5 km)",
        temporalResolution: "Annual",
        created: "2024-11-15",
        modified: "2025-05-10"
      },
      summary: "This EBV captures the timing of key phenological events across ecosystems. Indicators such as coniferous spring start and deciduous green-up are used to derive this EBV. Data are provided as gridded observations with full provenance and semantic context.",
      keywords: ["phenology", "vegetation", "spring start", "coniferous", "bioclimate", "Finland"],
      ontology: {
        label: "Ecosystem phenology",
        tag: "Ontology Class",
        definition: "A class of Essential Biodiversity Variables describing the timing of recurring biological events and seasonal dynamics in ecosystems.",
        synonym: "Phenological timing",
        units: "day of year (DOY)",
        broader: "Ecosystem functioning",
        related: ["Vegetation active period", "Coniferous spring start", "Deciduous green-up"],
        relations: [
          { source: "Ecosystem phenology", relation: "includes", target: "Vegetation active period" },
          { source: "Coniferous spring start", relation: "observed-by", target: "Phenology observation" },
          { source: "VAP day", relation: "has-unit", target: "Day of year" }
        ]
      },
      structure: [
        { type: "observation", family: "ontology", label: "Observation", sub: "Phenology Observation", icon: "◎" },
        { type: "coverage", family: "coveragejson", label: "CoverageJSON", sub: "BioClima Coverage", icon: "⬡" },
        { type: "ebv", family: "ebv", label: "EBV Definition", sub: "Ecosystem Phenology", icon: "🌿" },
        { type: "ecv", family: "ecv", label: "ECV Definition", sub: "Vegetation Active Period", icon: "〰️" },
        { type: "indicator", family: "indicator", label: "Spatial Indicator", sub: "Coniferous Spring Start Indicator", icon: "▥" },
        { type: "provenance", family: "provenance", label: "Provenance", sub: "Dataset Provenance", icon: "◇" },
        { type: "policy", family: "policy", label: "Policy Link", sub: "EU Biodiversity Strategy", icon: "◈" },
        { type: "zoning", family: "zoning", label: "Zoning", sub: "Ecoregions / Bioclimatic zones", icon: "▧" },
        { type: "ontology", family: "ontology", label: "Ontology Class", sub: "Phenological Trait", icon: "⌘" }
      ]
    },
    {
      id: "vegetation-active-period",
      type: "ecv",
      icon: "〰️",
      title: { en: "Vegetation Active Period", es: "Periodo activo de la vegetación" },
      description: {
        en: "Length and onset of the period with photosynthetically active vegetation.",
        es: "Duración e inicio del periodo con vegetación fotosintéticamente activa."
      },
      scope: "Global",
      layerId: "vap-deciduous",
      bblock: "ogc.bioclima.ebv.vap-deciduous",
      blockUrl: "../bblocks/bblock/ogc.bioclima.ebv.vap-deciduous",
      metadata: {
        identifier: "bc-ecv-vap",
        version: "1.0.0",
        publisher: "BioClima Consortium",
        license: "CC BY 4.0",
        spatialResolution: "0.05° (~5 km)",
        temporalResolution: "Annual",
        created: "2024-11-15",
        modified: "2025-05-10"
      },
      summary: "The Vegetation Active Period is represented as an annual day-of-year coverage for coniferous forests and deciduous vegetation. It is the observational basis for the phenological change indicator.",
      keywords: ["VAP", "green-up", "vegetation", "Finland", "MODIS"],
      ontology: {
        label: "Vegetation active period",
        tag: "Ontology Class",
        definition: "Annual period in which vegetation exhibits active growth or photosynthetic activity, represented in the pilot by the day-of-year of onset.",
        synonym: "Green-up period",
        units: "day of year (DOY)",
        broader: "Plant phenological phase",
        related: ["Coniferous spring start", "Deciduous green-up", "Phenology observation"],
        relations: [
          { source: "Vegetation active period", relation: "part-of", target: "Ecosystem phenology" },
          { source: "VAP onset", relation: "has-unit", target: "Day of year" },
          { source: "VAP onset", relation: "encoded-as", target: "CoverageJSON" }
        ]
      },
      structure: [
        { family: "coveragejson", label: "CoverageJSON", sub: "Annual gridded coverage", icon: "⬡" },
        { family: "ebv", label: "EBV dataset", sub: "VAP coniferous / deciduous", icon: "🌿" },
        { family: "provenance", label: "Provenance", sub: "MODIS processing chain", icon: "◇" },
        { family: "ontology", label: "Ontology Class", sub: "Vegetation active period", icon: "⌘" }
      ]
    },
    {
      id: "coniferous-spring-start",
      type: "indicator",
      icon: "▥",
      title: { en: "Coniferous Spring Start Indicator", es: "Indicador de inicio primaveral de coníferas" },
      description: {
        en: "Day of year when coniferous vegetation starts to green-up.",
        es: "Día del año en que la vegetación de coníferas inicia su actividad primaveral."
      },
      scope: "Finland",
      layerId: "vap-coniferous",
      bblock: "ogc.bioclima.ebv.vap-coniferous",
      blockUrl: "../bblocks/bblock/ogc.bioclima.ebv.vap-coniferous",
      metadata: {
        identifier: "vap-coniferous",
        version: "2.0.0",
        publisher: "Finnish Environment Institute / BioClima",
        license: "CC BY 4.0",
        spatialResolution: "0.05° (~5 km)",
        temporalResolution: "Annual, 2001–2018",
        created: "2023-07-18",
        modified: "2025-05-10"
      },
      summary: "Annual gridded observations of the start of the vegetation active period in coniferous forests in Finland, encoded as CoverageJSON and linked to the BioClima ontology.",
      keywords: ["coniferous", "spring start", "day of year", "CoverageJSON", "Finland"],
      ontology: {
        label: "Coniferous spring start",
        tag: "Ontology Class",
        definition: "The start of the annual period in which coniferous vegetation exhibits active growth, as indicated by the first appearance of new foliage or photosynthetic activity.",
        synonym: "Coniferous green-up onset",
        units: "day of year (DOY)",
        broader: "Plant phenological phase",
        related: ["Deciduous green-up", "Vegetation active period", "Phenology observation"],
        relations: [
          { source: "Coniferous spring start", relation: "is-a", target: "Plant phenological phase" },
          { source: "Coniferous spring start", relation: "part-of", target: "Vegetation active period" },
          { source: "Coniferous spring start", relation: "observed-by", target: "Phenology observation" },
          { source: "Coniferous spring start", relation: "has-unit", target: "Day of year" }
        ]
      },
      structure: [
        { family: "observation", label: "Observation", sub: "Phenology Observation", icon: "◎" },
        { family: "coveragejson", label: "CoverageJSON", sub: "VAP Coniferous Coverage", icon: "⬡" },
        { family: "ebv", label: "EBV Dataset", sub: "VAP — Coniferous forests", icon: "🌿" },
        { family: "provenance", label: "Provenance", sub: "MODIS / processing lineage", icon: "◇" },
        { family: "policy", label: "Policy Link", sub: "KMGBF Target 8 / SDG 15", icon: "◈" },
        { family: "ontology", label: "Ontology Class", sub: "Coniferous spring start", icon: "⌘" }
      ]
    },
    {
      id: "deciduous-green-up",
      type: "indicator",
      icon: "▥",
      title: { en: "Deciduous Green-up Indicator", es: "Indicador de brotación de vegetación caducifolia" },
      description: {
        en: "Day of year when deciduous vegetation starts to green-up.",
        es: "Día del año en que la vegetación caducifolia inicia la brotación."
      },
      scope: "Finland",
      layerId: "vap-deciduous",
      bblock: "ogc.bioclima.ebv.vap-deciduous",
      blockUrl: "../bblocks/bblock/ogc.bioclima.ebv.vap-deciduous",
      metadata: {
        identifier: "vap-deciduous",
        version: "2.0.0",
        publisher: "Finnish Environment Institute / BioClima",
        license: "CC BY 4.0",
        spatialResolution: "0.05° (~5 km)",
        temporalResolution: "Annual, 2001–2018",
        created: "2023-07-18",
        modified: "2025-05-10"
      },
      summary: "Annual gridded observations of deciduous green-up onset in Finland, linked to the same EBV/ECV model and semantic vocabulary.",
      keywords: ["deciduous", "green-up", "day of year", "CoverageJSON", "Finland"],
      ontology: {
        label: "Deciduous green-up",
        tag: "Ontology Class",
        definition: "The onset of visible leaf development in deciduous vegetation, represented as a day-of-year phenological observation.",
        synonym: "Deciduous leaf unfolding",
        units: "day of year (DOY)",
        broader: "Plant phenological phase",
        related: ["Coniferous spring start", "Vegetation active period", "Phenology observation"],
        relations: [
          { source: "Deciduous green-up", relation: "is-a", target: "Plant phenological phase" },
          { source: "Deciduous green-up", relation: "part-of", target: "Vegetation active period" },
          { source: "Deciduous green-up", relation: "encoded-as", target: "CoverageJSON" }
        ]
      },
      structure: [
        { family: "observation", label: "Observation", sub: "Phenology Observation", icon: "◎" },
        { family: "coveragejson", label: "CoverageJSON", sub: "VAP Deciduous Coverage", icon: "⬡" },
        { family: "ebv", label: "EBV Dataset", sub: "VAP — Deciduous vegetation", icon: "🌿" },
        { family: "provenance", label: "Provenance", sub: "NDWI / MODIS lineage", icon: "◇" },
        { family: "ontology", label: "Ontology Class", sub: "Deciduous green-up", icon: "⌘" }
      ]
    },
    {
      id: "coveragejson-bioclima-coverage",
      type: "coveragejson",
      icon: "⬡",
      title: { en: "CoverageJSON BioClima Coverage", es: "Cobertura BioClima en CoverageJSON" },
      description: {
        en: "Gridded bioclimate observation coverage in CoverageJSON encoding.",
        es: "Cobertura de observaciones bioclimáticas malladas codificada en CoverageJSON."
      },
      scope: "Global",
      layerId: "vap-coniferous",
      bblock: "ogc.bioclima.coveragejson.bioclima-coverage",
      blockUrl: "../bblocks/bblock/ogc.bioclima.coveragejson.bioclima-coverage",
      metadata: {
        identifier: "coveragejson.bioclima-coverage",
        version: "1.0.0",
        publisher: "BioClima Consortium",
        license: "CC BY 4.0",
        spatialResolution: "Variable",
        temporalResolution: "Variable",
        created: "2024-11-15",
        modified: "2025-05-10"
      },
      summary: "Reusable CoverageJSON profile used as the pivot block for gridded EBV, ECV and indicator outputs in the BioClima register.",
      keywords: ["CoverageJSON", "coverage", "grid", "API", "interoperability"],
      ontology: {
        label: "BioClima CoverageJSON coverage",
        tag: "Building Block",
        definition: "Reusable profile for representing gridded bioclimate observations and indicators as machine-readable CoverageJSON resources.",
        synonym: "BioClima gridded coverage",
        units: "depends on parameter",
        broader: "Coverage data model",
        related: ["EBV coverage", "Spatial indicator", "Phenology observation"],
        relations: [
          { source: "CoverageJSON", relation: "encodes", target: "Observation coverage" },
          { source: "CoverageJSON", relation: "parameter", target: "VAP day" },
          { source: "CoverageJSON", relation: "parameter", target: "PCI trend" }
        ]
      },
      structure: [
        { family: "coveragejson", label: "Domain", sub: "x / y / t axes", icon: "⬡" },
        { family: "coveragejson", label: "Parameters", sub: "Observed properties", icon: "▦" },
        { family: "ontology", label: "Semantic links", sub: "SKOS concepts", icon: "⌘" },
        { family: "provenance", label: "Provenance", sub: "Source and processing", icon: "◇" },
        { family: "policy", label: "Policy Alignment", sub: "Targets and reporting", icon: "◈" }
      ]
    },
    {
      id: "phenological-change-indicator",
      type: "indicator",
      icon: "▥",
      title: { en: "Phenological Change Indicator", es: "Indicador de cambio fenológico" },
      description: {
        en: "Composite indicator with trend, anomaly, changepoint year and changepoint p-value.",
        es: "Indicador compuesto con tendencia, anomalía, año de cambio y valor p del cambio."
      },
      scope: "Finland",
      layerId: "pci",
      bblock: "ogc.bioclima.indicator.pci",
      blockUrl: "../bblocks/bblock/ogc.bioclima.indicator.pci",
      metadata: {
        identifier: "indicator.pci",
        version: "0.3.0",
        publisher: "BioClima Consortium",
        license: "CC BY 4.0",
        spatialResolution: "0.05° (~5 km)",
        temporalResolution: "2001–2018 analysis",
        created: "2025-05-10",
        modified: "2025-05-10"
      },
      summary: "The PCI summarises changes in phenological timing using four parameters derived from annual VAP time series. It can be visualised parameter by parameter and connected to policy targets.",
      keywords: ["PCI", "trend", "anomaly", "Pettitt", "Theil-Sen", "policy"],
      ontology: {
        label: "Phenological Change Indicator",
        tag: "Indicator",
        definition: "Composite spatial indicator describing temporal changes in vegetation phenology from annual vegetation active period observations.",
        synonym: "PCI",
        units: "parameter-specific",
        broader: "Spatial biodiversity indicator",
        related: ["PCI trend", "PCI anomaly", "Changepoint year", "KMGBF Target 8"],
        relations: [
          { source: "PCI", relation: "derived-from", target: "VAP coniferous" },
          { source: "PCI", relation: "derived-from", target: "VAP deciduous" },
          { source: "PCI", relation: "informs", target: "KMGBF Target 8" }
        ]
      },
      structure: [
        { family: "ebv", label: "Input EBV", sub: "VAP Coniferous", icon: "🌿" },
        { family: "ebv", label: "Input EBV", sub: "VAP Deciduous", icon: "🌿" },
        { family: "indicator", label: "Indicator Recipe", sub: "Theil-Sen + Pettitt", icon: "▥" },
        { family: "coveragejson", label: "ParameterGroup", sub: "trend / anomaly / changepoint", icon: "⬡" },
        { family: "zoning", label: "Zonification", sub: "PCI-derived zones", icon: "▧" },
        { family: "policy", label: "Policy Alignment", sub: "KMGBF / SDG", icon: "◈" },
        { family: "ontology", label: "Ontology Classes", sub: "indicator parameters", icon: "⌘" }
      ]
    },
    {
      id: "bioclimatic-zones",
      type: "zoning",
      icon: "▧",
      title: { en: "Bioclimatic Zones", es: "Zonas bioclimáticas" },
      description: {
        en: "Aggregated polygon zones derived from the phenological change indicator.",
        es: "Zonas poligonales agregadas derivadas del indicador de cambio fenológico."
      },
      scope: "Finland",
      layerId: "bioclimatic-zones",
      bblock: "ogc.bioclima.zonification.bioclimatic-zone",
      blockUrl: "../bblocks/bblock/ogc.bioclima.zonification.bioclimatic-zone",
      metadata: {
        identifier: "zonification.bioclimatic-zone",
        version: "0.2.0",
        publisher: "BioClima Consortium",
        license: "CC BY 4.0",
        spatialResolution: "Derived polygons",
        temporalResolution: "2001–2018 analysis",
        created: "2025-05-10",
        modified: "2025-05-10"
      },
      summary: "Bioclimatic zones group spatially contiguous pixels with similar phenological change behaviour and provide a more readable decision-support layer than per-pixel cells.",
      keywords: ["zones", "polygon", "PCI", "decision support", "Finland"],
      ontology: {
        label: "Bioclimatic zone",
        tag: "Zoning",
        definition: "Spatial unit derived from bioclimatic indicator values and used to summarise coherent areas for interpretation and decision support.",
        synonym: "Phenological change zone",
        units: "area / category",
        broader: "Spatial reporting unit",
        related: ["PCI trend", "strong advance", "stable", "delay"],
        relations: [
          { source: "Bioclimatic zone", relation: "derived-from", target: "PCI trend" },
          { source: "Bioclimatic zone", relation: "supports", target: "Policy interpretation" }
        ]
      },
      structure: [
        { family: "indicator", label: "Input Indicator", sub: "PCI trend", icon: "▥" },
        { family: "zoning", label: "Classification", sub: "advance / stable / delay", icon: "▧" },
        { family: "zoning", label: "Aggregation", sub: "connected components", icon: "▧" },
        { family: "coveragejson", label: "Output", sub: "GeoJSON polygons", icon: "⬡" },
        { family: "policy", label: "Policy Link", sub: "spatial targeting", icon: "◈" }
      ]
    }
  ],
  fallbackLayers: [
    {
      id: "vap-coniferous",
      bblock: "ogc.bioclima.ebv.vap-coniferous",
      family: "ebv",
      kind: "coverage",
      title: { en: "VAP — Coniferous forests (Finland)", es: "VAP — Bosques de coníferas (Finlandia)" },
      dataUrl: "../_sources/ebv/vap-coniferous/examples/finland-vap-coniferous-2001-2018.covjson",
      unit: { symbol: "DOY" },
      range: [60, 160],
      colorRamp: ["#3B8BD4", "#FCDE5A", "#E85D24"]
    },
    {
      id: "vap-deciduous",
      bblock: "ogc.bioclima.ebv.vap-deciduous",
      family: "ebv",
      kind: "coverage",
      title: { en: "VAP — Deciduous vegetation (Finland)", es: "VAP — Vegetación caducifolia (Finlandia)" },
      dataUrl: "../_sources/ebv/vap-deciduous/examples/finland-vap-deciduous-2001-2018.covjson",
      unit: { symbol: "DOY" },
      range: [60, 160],
      colorRamp: ["#3B8BD4", "#FCDE5A", "#E85D24"]
    },
    {
      id: "pci",
      bblock: "ogc.bioclima.indicator.pci",
      family: "indicator",
      kind: "coverage",
      title: { en: "PCI — Phenological Change Indicator", es: "PCI — Indicador de cambio fenológico" },
      dataUrl: "../_sources/indicator/pci/examples/pci-finland-2001-2018.covjson",
      isParameterGroup: true,
      defaultParameter: "trend",
      parameters: [
        { key: "trend", label: { en: "Trend", es: "Tendencia" }, unit: { symbol: "d/yr" }, range: [-0.8, 0.8], colorRamp: ["#1D9E75", "#F1EFE8", "#E24B4A"] },
        { key: "anomaly", label: { en: "Anomaly", es: "Anomalía" }, unit: { symbol: "d" }, range: [-15, 15], colorRamp: ["#1D9E75", "#F1EFE8", "#E24B4A"] },
        { key: "changepoint_year", label: { en: "Changepoint year", es: "Año del punto de cambio" }, unit: { symbol: "yr" }, range: [2002, 2017], colorRamp: ["#3B8BD4", "#FCDE5A", "#7F77DD"] },
        { key: "changepoint_pvalue", label: { en: "Changepoint p-value", es: "Valor p" }, unit: { symbol: "—" }, range: [0, 1], colorRamp: ["#E24B4A", "#F1EFE8", "#3B8BD4"] }
      ]
    },
    {
      id: "bioclimatic-zones",
      bblock: "ogc.bioclima.zonification.bioclimatic-zone",
      family: "zonification",
      kind: "geojson",
      title: { en: "Bioclimatic zones (PCI-based)", es: "Zonas bioclimáticas (basadas en PCI)" },
      dataUrl: "../_sources/zonification/bioclimatic-zone/examples/finland-zones-2001-2018.geojson"
    }
  ]
};
