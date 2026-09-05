// Every user-facing string. The page ships in Portuguese and switches to
// English from the browser language or the header selector.
// Values marked "html" keep the exact markup of the element they replace.
export type Lang = "pt" | "en";
export const LANGUAGES: Lang[] = ["pt", "en"];
export const LANG_STORAGE = "bone-age-lang";

const pt = {
  "app.title": "Bone Age — idade óssea, localmente",
  "app.description":
    "Estimativa experimental de idade óssea com processamento local no navegador. Suas radiografias permanecem no seu dispositivo.",
  "app.htmlLang": "pt-BR",
  "app.locale": "pt-BR",

  "nav.brand": "Bone Age, início",
  "nav.label": "Navegação",
  "nav.how": "Como funciona",
  "nav.source": 'Código aberto <span aria-hidden="true">↗</span>',
  "nav.language": "Idioma",
  "nav.langPt": "Português",
  "nav.langEn": "English",

  "hero.eyebrow": "INTELIGÊNCIA ARTIFICIAL · PROCESSAMENTO LOCAL",
  "hero.title": "Idade óssea.<br /><span>No seu navegador.</span>",
  "hero.description":
    "Da radiografia à estimativa de maturação óssea.<br />Seus arquivos ficam com você, do início ao fim.",
  "hero.localTitle": "Seu dispositivo. Seus dados.",
  "hero.localText":
    "Sem upload para servidores.<br />Sem cadastro. Sem rastreamento.",

  "workspace.title": "Nova análise",
  "workspace.badge": "USO EXPERIMENTAL",
  "workspace.label": "Radiografia e dados do exame",
  "steps.label": "Etapas da análise",
  "steps.one": "<span>01</span> Abrir radiografia",
  "steps.two": "<span>02</span> Preparar imagem",
  "steps.three": "<span>03</span> Calcular idade óssea",

  "image.title": "Radiografia da mão esquerda",
  "image.localFile": "ARQUIVO LOCAL",
  "image.select": "Selecionar radiografia",
  "image.dropzone": "Selecionar ou arrastar radiografia",
  "image.canvas":
    "Radiografia. Arraste para selecionar a mão esquerda ou use os campos de recorte abaixo.",
  "image.footer":
    '<span class="tiny-lock" aria-hidden="true">◈</span> A imagem é aberta localmente e não sai deste navegador.',

  "dropzone.title": "Arraste sua radiografia até aqui",
  "dropzone.subtitle": "ou <u>selecione um arquivo</u> no dispositivo",
  "dropzone.others": "+ outros",
  "dropzone.limit": "Arquivo original recomendado · até 100 MB",

  "viewer.rotate": "Girar imagem 90 graus",
  "viewer.rotateLabel": "Girar",
  "viewer.fullCrop": "Imagem inteira",
  "viewer.replace": "Trocar",
  "viewer.instruction":
    "Arraste sobre a imagem para recortar <strong>apenas a mão esquerda</strong>. Inclua os cinco dedos e o punho; retire o excesso de antebraço.",
  "viewer.cropDetails": "Ajustar recorte por coordenadas",
  "viewer.x0": "X inicial",
  "viewer.y0": "Y inicial",
  "viewer.x1": "X final",
  "viewer.y1": "Y final",

  "form.title": "Dados do exame",
  "form.sex": "Sexo biológico <span>obrigatório</span>",
  "form.sexPlaceholder": "Selecione",
  "form.male": "Masculino",
  "form.female": "Feminino",
  "form.sexHelp": "Usado pelo modelo para estimar a maturação óssea.",
  "form.dob": "Data de nascimento <span>opcional</span>",
  "form.examDate": "Data do exame",
  "form.chrono": "Idade na data do exame",
  "form.confirm":
    "Conferi que o recorte contém a <strong>mão esquerda em PA</strong>, com dedos para cima e punho visível.",
  "form.submit": 'Calcular idade óssea <span aria-hidden="true">→</span>',
  "form.cancel": "Cancelar processamento",
  "form.clinicalNote":
    "Estimativa experimental. Não é um laudo e não deve orientar decisões médicas sem avaliação profissional.",

  "progress.preparing": "Preparando…",
  "progress.local": "O processamento ocorre neste dispositivo.",
  "progress.opening": "Abrindo radiografia localmente…",
  "progress.model": "Preparando modelo local…",
  "progress.infer":
    "Três redes são executadas em sequência. Isso pode levar alguns minutos.",
  "progress.prepare": "Somente arquivos públicos do modelo serão baixados.",
  "progress.cache": "Lendo cache",
  "progress.download": "Baixando pesos",
  "progress.compute": "Calculando",
  "progress.done": "Rede concluída",
  "progress.fold": "{stage} · rede {fold}/3",

  "model.label": "Modelo local",
  "model.networks": "3 redes · WebAssembly",
  "model.initial":
    "Primeiro uso: download de ~340 MB. Depois, reutilize os pesos em cache.",
  "model.download": "Baixar modelo",
  "model.clearCache": "Limpar cache",
  "model.clearCacheTitle":
    "Apagar somente os pesos públicos salvos no navegador",
  "model.ready":
    "Download concluído. Pesos disponíveis para cálculo local; cache sujeito ao espaço do navegador.",
  "model.executed":
    "Modelo executado neste navegador. Os pesos baixados são reutilizados quando o cache está disponível.",
  "model.cleared":
    "Cache de pesos removido. O próximo cálculo precisará baixar ~340 MB.",

  "result.eyebrow": "PROCESSAMENTO CONCLUÍDO NESTE DISPOSITIVO",
  "result.title": "Resultado da estimativa",
  "result.save": "Salvar relatório ↓",
  "result.estimated": "Idade óssea estimada",
  "result.chrono": "Idade cronológica",
  "result.difference": "Diferença estimada",
  "result.differenceNote": "Comparação descritiva, sem classificação diagnóstica.",
  "result.note":
    "O resultado depende da qualidade, orientação e recorte da imagem. A diferença entre idades, isoladamente, não define atraso ou avanço anormal de maturação.",
  "result.details": "Detalhes da execução local",
  "result.months": "{months} meses · média das três redes",
  "result.noChrono": "Não informada",
  "result.examOn": "Exame em {date}",
  "result.differenceMonths": "{sign}{months} meses",
  "result.execution":
    "{model} · revisão {revision} · ONNX FP32 · WebAssembly/CPU · {seconds} s · redes: {folds} meses · recorte: {crop} · sexo: {sex}.",

  "about.eyebrow": "TRANSPARÊNCIA POR PRINCÍPIO",
  "about.title": "O que acontece<br />com a sua imagem?",
  "about.text":
    "Ela permanece na memória desta página.<br />Ao recarregar ou fechar a aba, os dados da análise são descartados.",
  "about.reset": "Descartar análise atual ↗",
  "faq.q1": "Como a estimativa é calculada?",
  "faq.a1":
    'Três redes ConvNeXtV2 do modelo <a href="https://huggingface.co/ianpan/bone-age" target="_blank" rel="noreferrer">ianpan/bone-age</a> analisam a mão esquerda e o sexo informado. O resultado é a média das três previsões, em meses. O site aplica ajuste de histograma e dimensiona a imagem para 512 × 512 pixels.',
  "faq.q2": "Quais imagens posso abrir?",
  "faq.a2":
    "DICOM Part 10, com ou sem extensão, monocromático de 8/16 bits sem compressão ou JPEG baseline; JPEG, PNG, TIFF de uma página, WebP, BMP e AVIF. DICOM JPEG lossless, JPEG-LS, JPEG 2000 e multiframe ainda exigem exportação para um formato aceito. Prefira a radiografia original da mão esquerda em PA.",
  "faq.q3": "Funciona sem internet?",
  "faq.a3":
    "Sim, após abrir o site e concluir o download do modelo com cache disponível. A internet é usada para baixar o site e, do repositório público do projeto no GitHub, os pesos do modelo. Nenhuma imagem, data ou resultado é enviado. O navegador pode remover o cache se faltar espaço. A primeira execução pode demorar; computadores com navegador atualizado e memória disponível são mais adequados.",
  "faq.q4": "Qual é a limitação clínica?",
  "faq.a4":
    "Esta ferramenta é experimental e o modelo não é aprovado para uso clínico. O erro médio publicado no conjunto de teste não representa a margem de erro para uma pessoa. A validação técnica da conversão para ONNX não equivale a validação clínica.",

  "credits.eyebrow": "CRÉDITO DO MODELO",
  "credits.title": "O modelo de IA é de Ian Pan.",
  "credits.text":
    'A estimativa vem do modelo <a href="https://huggingface.co/ianpan/bone-age" target="_blank" rel="noreferrer">ianpan/bone-age</a>, criado e treinado por <a href="https://huggingface.co/ianpan" target="_blank" rel="noreferrer">Ian Pan</a> sobre 14.036 radiografias do <a href="https://www.rsna.org/rsnai/ai-image-challenge/rsna-pediatric-bone-age-challenge-2017" target="_blank" rel="noreferrer">RSNA Pediatric Bone Age Challenge 2017</a>, com backbone ConvNeXtV2 e licença Apache-2.0.',
  "credits.role":
    "Este site não treinou nem ajustou nada: ele converte os pesos públicos para ONNX e os executa no seu navegador. O mérito da estimativa é do autor do modelo.",

  "footer.tagline": "/ uma ferramenta aberta de pesquisa",
  "footer.by": "por",
  "footer.license": "Modelo Apache-2.0 · Código MIT",
  "date.format": "{day}/{month}/{year}",

  "age.years": "{years} {yearWord} e {months} {monthWord}",
  "age.year": "ano",
  "age.yearPlural": "anos",
  "age.month": "mês",
  "age.monthPlural": "meses",
  "sex.male": "masculino",
  "sex.female": "feminino",

  "msg.checkDates": "Verifique as datas",
  "msg.dicomFilled":
    "Os campos disponíveis foram preenchidos pelo DICOM. Confira os dados e selecione a mão esquerda antes de calcular.",
  "msg.fieldsCleared":
    "Os dados do exame foram limpos para a nova imagem. Informe sexo e data de nascimento novamente.",
  "msg.openFailed": "Não foi possível abrir este arquivo.",
  "msg.oneFile": "Selecione uma radiografia por vez.",
  "msg.workerStopped":
    "O worker foi interrompido. Feche outras abas para liberar memória e tente novamente.",
  "msg.readyNotice":
    "Download concluído. Você já pode abrir uma radiografia e executar o modelo.",
  "msg.cancelled":
    "Processamento cancelado. Nenhum resultado parcial foi apresentado.",
  "msg.cacheCleared":
    "Os pesos do modelo foram removidos do cache deste navegador.",
  "msg.cacheBlocked": "O navegador não permite acessar o cache neste modo.",
  "msg.noOffline":
    "O navegador não habilitou o modo offline. A execução local continua disponível com conexão.",

  "worker.noCache":
    "Cache indisponível neste navegador. O cálculo continua localmente, mas o uso offline não estará disponível.",
  "worker.noSpace":
    "Sem espaço para cache. O cálculo continua; os pesos precisarão ser baixados no próximo uso.",
  "worker.downloadFailed":
    "Falha ao baixar rede {fold} ({status}). Verifique a conexão e tente novamente.",
  "worker.badSize": "Arquivo do modelo tem tamanho inesperado.",
  "worker.unavailable": "O modelo não está disponível nesta instalação.",
  "worker.badManifest": "Manifesto do modelo inválido.",
  "worker.noReference": "Referência de pré-processamento indisponível.",
  "worker.noContrast":
    "O recorte não tem contraste. Selecione a mão na radiografia.",

  "worker.integrity":
    "Verificação de integridade do modelo falhou. Tente baixar novamente.",
  "worker.badOutput": "A rede retornou um resultado inválido.",
  "worker.failed":
    "Não foi possível executar o modelo. O navegador pode estar sem memória. Feche outras abas e tente novamente.",
  "decode.noPixels": "DICOM sem dados de imagem.",
  "decode.truncated": "Dados DICOM truncados.",
  "decode.tiffEmpty": "TIFF sem imagem.",
  "processing.emptyHistogram": "Histograma vazio.",
  "decode.badSize": "Dimensões inválidas ou imagem maior que 24 megapixels.",
  "decode.dicomUnreadable":
    "Não foi possível ler o DICOM. Use um arquivo DICOM Part 10 original, PNG ou TIFF.",
  "decode.dicomMultiframe":
    "DICOM multiframe: exporte uma única radiografia para analisar.",
  "decode.dicomMonochrome":
    "Use um DICOM monocromático de radiografia da mão.",
  "decode.dicomChannels": "DICOM com múltiplos canais não suportado.",
  "decode.dicomJpegSize": "Dimensões DICOM e JPEG incompatíveis.",
  "decode.dicomBits":
    "DICOM precisa ter pixels inteiros de 8 ou 16 bits com alinhamento padrão.",
  "decode.dicomLut": "VOI LUT com profundidade não suportada.",
  "decode.dicomWindow": "Janela DICOM inválida.",
  "decode.empty": "A radiografia está vazia ou tem contraste constante.",
  "decode.tooLarge": "O limite por imagem é 100 MB.",
  "decode.emptyFile": "O arquivo está vazio.",
  "decode.tiffPages":
    "TIFF com múltiplas páginas: exporte apenas a radiografia desejada.",
  "decode.unknownFormat":
    "Formato não reconhecido. Use DICOM, PNG, JPEG, TIFF, WebP, BMP ou AVIF.",
  "decode.failed":
    "Não foi possível decodificar a imagem. Confira o formato e o tamanho.",

  "processing.cropTooSmall":
    "Selecione uma região de pelo menos 32 × 32 pixels, dentro da imagem.",
  "processing.badReference": "Referência de histograma inválida.",
  "processing.badDates": "Informe datas válidas.",
  "processing.birthAfterExam": "O nascimento não pode ser posterior ao exame.",
  "processing.tooOld":
    "O modelo é pediátrico. Verifique as datas (idade até 20 anos).",

  "pdf.productName": "bone age",
  "pdf.title": "Relatório de idade óssea",
  "pdf.subtitle":
    "Estimativa gerada localmente no navegador, a partir de uma radiografia de mão esquerda.",
  "pdf.generatedOn": "Gerado em {datetime}",
  "pdf.ensembleCaption": "média das três redes",
  "pdf.sexLabel": "Sexo biológico",
  "pdf.dobLabel": "Data de nascimento",
  "pdf.fileLabel": "Arquivo de origem",
  "pdf.imageSizeLabel": "Imagem analisada",
  "pdf.radiograph": "Radiografia analisada",
  "pdf.radiographCaption":
    "Recorte enviado às redes, já orientado. A imagem não foi enviada a nenhum servidor.",
  "pdf.technical": "Execução",
  "pdf.ensembleMean": "Média do ensemble",
  "pdf.networkOutput": "Rede {index}",
  "pdf.runtime": "Tempo total",
  "pdf.cropLabel": "Recorte [x0, y0, x1, y1]",
  "pdf.modelLabel": "Modelo",
  "pdf.revisionLabel": "Revisão",
  "pdf.environmentLabel": "Ambiente",
  "pdf.environmentValue": "ONNX FP32 · WebAssembly/CPU · navegador",
  "pdf.preprocessingLabel": "Pré-processamento",
  "pdf.preprocessingValue":
    "Decodificação local, recorte manual, ajuste de histograma, interpolação bilinear, padding 512×512.",
  "pdf.references": "Referências e créditos",
  "pdf.refModel":
    "Modelo ianpan/bone-age, criado e treinado por Ian Pan — huggingface.co/ianpan/bone-age",
  "pdf.refArchitecture":
    "Arquitetura ConvNeXtV2-tiny, ensemble de três redes, 84,1 M de parâmetros.",
  "pdf.refDataset":
    "Treinado em 14.036 radiografias de mão do RSNA Pediatric Bone Age Challenge 2017; erro médio publicado de 4,16 meses no conjunto de teste.",
  "pdf.refLicense":
    "Pesos redistribuídos sob a Apache License 2.0, com aviso de modificação: conversão para ONNX, sem retreinamento.",
  "pdf.refApplication":
    "Aplicativo bone-age.app, código sob licença MIT — github.com/feliperun/bone-age",
  "pdf.disclaimerHeading": "Aviso",
  "pdf.pageNumber": "{page}/{total}",
  "pdf.secondsValue": "{seconds} s",
  "pdf.cropValue": "{x0}, {y0}, {x1}, {y1}",
  "pdf.imageSizeValue": "{width} × {height} px",
  "msg.reportFailed":
    "Não foi possível gerar o PDF. Tente novamente ou use outra aba do navegador.",

  "report.filename": "idade-ossea",
  "report.notComputed": "não calculada",
  "report.monthsValue": "{months} meses",
  "report.disclaimer":
    "Resultado experimental. Não é um laudo nem estabelece diagnóstico. O erro médio publicado não é um intervalo de confiança individual.",
  "report.privacy": "Nenhuma imagem ou dado do exame foi enviado a servidores.",
} as const;

export type Key = keyof typeof pt;

const en: Record<Key, string> = {
  "app.title": "Bone Age — bone age, locally",
  "app.description":
    "Experimental bone age estimation processed locally in the browser. Your radiographs stay on your device.",
  "app.htmlLang": "en",
  "app.locale": "en-US",

  "nav.brand": "Bone Age, home",
  "nav.label": "Navigation",
  "nav.how": "How it works",
  "nav.source": 'Open source <span aria-hidden="true">↗</span>',
  "nav.language": "Language",
  "nav.langPt": "Português",
  "nav.langEn": "English",

  "hero.eyebrow": "ARTIFICIAL INTELLIGENCE · LOCAL PROCESSING",
  "hero.title": "Bone age.<br /><span>In your browser.</span>",
  "hero.description":
    "From the radiograph to a bone maturation estimate.<br />Your files stay with you, start to finish.",
  "hero.localTitle": "Your device. Your data.",
  "hero.localText": "No server uploads.<br />No sign-up. No tracking.",

  "workspace.title": "New analysis",
  "workspace.badge": "EXPERIMENTAL USE",
  "workspace.label": "Radiograph and examination data",
  "steps.label": "Analysis steps",
  "steps.one": "<span>01</span> Open radiograph",
  "steps.two": "<span>02</span> Prepare image",
  "steps.three": "<span>03</span> Estimate bone age",

  "image.title": "Left hand radiograph",
  "image.localFile": "LOCAL FILE",
  "image.select": "Select radiograph",
  "image.dropzone": "Select or drag a radiograph",
  "image.canvas":
    "Radiograph. Drag to select the left hand, or use the crop fields below.",
  "image.footer":
    '<span class="tiny-lock" aria-hidden="true">◈</span> The image is opened locally and never leaves this browser.',

  "dropzone.title": "Drag your radiograph here",
  "dropzone.subtitle": "or <u>choose a file</u> from your device",
  "dropzone.others": "+ others",
  "dropzone.limit": "Original file recommended · up to 100 MB",

  "viewer.rotate": "Rotate image 90 degrees",
  "viewer.rotateLabel": "Rotate",
  "viewer.fullCrop": "Whole image",
  "viewer.replace": "Replace",
  "viewer.instruction":
    "Drag over the image to crop <strong>the left hand only</strong>. Include all five fingers and the wrist; leave out the excess forearm.",
  "viewer.cropDetails": "Adjust the crop by coordinates",
  "viewer.x0": "Start X",
  "viewer.y0": "Start Y",
  "viewer.x1": "End X",
  "viewer.y1": "End Y",

  "form.title": "Examination data",
  "form.sex": "Biological sex <span>required</span>",
  "form.sexPlaceholder": "Select",
  "form.male": "Male",
  "form.female": "Female",
  "form.sexHelp": "Used by the model to estimate bone maturation.",
  "form.dob": "Date of birth <span>optional</span>",
  "form.examDate": "Examination date",
  "form.chrono": "Age on the examination date",
  "form.confirm":
    "I confirm the crop contains the <strong>left hand in PA view</strong>, fingers up and wrist visible.",
  "form.submit": 'Estimate bone age <span aria-hidden="true">→</span>',
  "form.cancel": "Cancel processing",
  "form.clinicalNote":
    "Experimental estimate. It is not a report and must not guide medical decisions without professional assessment.",

  "progress.preparing": "Preparing…",
  "progress.local": "Processing happens on this device.",
  "progress.opening": "Opening the radiograph locally…",
  "progress.model": "Preparing the local model…",
  "progress.infer":
    "Three networks run in sequence. This can take a few minutes.",
  "progress.prepare": "Only public model files will be downloaded.",
  "progress.cache": "Reading cache",
  "progress.download": "Downloading weights",
  "progress.compute": "Computing",
  "progress.done": "Network finished",
  "progress.fold": "{stage} · network {fold}/3",

  "model.label": "Local model",
  "model.networks": "3 networks · WebAssembly",
  "model.initial":
    "First use downloads about 340 MB. After that, the cached weights are reused.",
  "model.download": "Download model",
  "model.clearCache": "Clear cache",
  "model.clearCacheTitle": "Delete only the public weights stored in this browser",
  "model.ready":
    "Download complete. Weights ready for local computation; caching depends on browser storage.",
  "model.executed":
    "Model executed in this browser. Downloaded weights are reused whenever the cache is available.",
  "model.cleared":
    "Weight cache removed. The next run will need to download about 340 MB again.",

  "result.eyebrow": "PROCESSING COMPLETED ON THIS DEVICE",
  "result.title": "Estimate result",
  "result.save": "Save report ↓",
  "result.estimated": "Estimated bone age",
  "result.chrono": "Chronological age",
  "result.difference": "Estimated difference",
  "result.differenceNote": "Descriptive comparison, not a diagnostic classification.",
  "result.note":
    "The result depends on image quality, orientation and crop. The difference between ages, on its own, does not establish abnormally delayed or advanced maturation.",
  "result.details": "Local execution details",
  "result.months": "{months} months · mean of the three networks",
  "result.noChrono": "Not provided",
  "result.examOn": "Examined on {date}",
  "result.differenceMonths": "{sign}{months} months",
  "result.execution":
    "{model} · revision {revision} · ONNX FP32 · WebAssembly/CPU · {seconds} s · networks: {folds} months · crop: {crop} · sex: {sex}.",

  "about.eyebrow": "TRANSPARENCY BY PRINCIPLE",
  "about.title": "What happens<br />to your image?",
  "about.text":
    "It stays in this page's memory.<br />Reloading or closing the tab discards the analysis data.",
  "about.reset": "Discard current analysis ↗",
  "faq.q1": "How is the estimate computed?",
  "faq.a1":
    'Three ConvNeXtV2 networks from the <a href="https://huggingface.co/ianpan/bone-age" target="_blank" rel="noreferrer">ianpan/bone-age</a> model analyse the left hand and the sex you provide. The result is the mean of the three predictions, in months. The site applies histogram matching and resizes the image to 512 × 512 pixels.',
  "faq.q2": "Which images can I open?",
  "faq.a2":
    "DICOM Part 10, with or without an extension, monochrome 8/16-bit uncompressed or baseline JPEG; JPEG, PNG, single-page TIFF, WebP, BMP and AVIF. DICOM JPEG lossless, JPEG-LS, JPEG 2000 and multiframe still require exporting to a supported format. Prefer the original left-hand PA radiograph.",
  "faq.q3": "Does it work without internet?",
  "faq.a3":
    "Yes, once the site is open and the model download has finished with caching available. The internet is used to download the site and, from the project's public GitHub repository, the model weights. No image, date or result is ever sent. The browser may drop the cache when storage runs low. The first run can be slow; an up-to-date desktop browser with free memory works best.",
  "faq.q4": "What is the clinical limitation?",
  "faq.a4":
    "This tool is experimental and the model is not approved for clinical use. The published mean error on the test set is not the margin of error for an individual. Technical validation of the ONNX conversion is not clinical validation.",

  "credits.eyebrow": "MODEL CREDIT",
  "credits.title": "The AI model is Ian Pan's.",
  "credits.text":
    'The estimate comes from the <a href="https://huggingface.co/ianpan/bone-age" target="_blank" rel="noreferrer">ianpan/bone-age</a> model, created and trained by <a href="https://huggingface.co/ianpan" target="_blank" rel="noreferrer">Ian Pan</a> on 14,036 radiographs from the <a href="https://www.rsna.org/rsnai/ai-image-challenge/rsna-pediatric-bone-age-challenge-2017" target="_blank" rel="noreferrer">RSNA Pediatric Bone Age Challenge 2017</a>, with a ConvNeXtV2 backbone and the Apache-2.0 licence.',
  "credits.role":
    "This site trained and tuned nothing: it converts the public weights to ONNX and runs them in your browser. Credit for the estimate belongs to the model's author.",

  "footer.tagline": "/ an open research tool",
  "footer.by": "by",
  "footer.license": "Model Apache-2.0 · Code MIT",
  "date.format": "{month}/{day}/{year}",

  "age.years": "{years} {yearWord} and {months} {monthWord}",
  "age.year": "year",
  "age.yearPlural": "years",
  "age.month": "month",
  "age.monthPlural": "months",
  "sex.male": "male",
  "sex.female": "female",

  "msg.checkDates": "Check the dates",
  "msg.dicomFilled":
    "The available fields were filled in from the DICOM. Check the data and select the left hand before estimating.",
  "msg.fieldsCleared":
    "The examination data was cleared for the new image. Enter sex and date of birth again.",
  "msg.openFailed": "This file could not be opened.",
  "msg.oneFile": "Select one radiograph at a time.",
  "msg.workerStopped":
    "The worker stopped. Close other tabs to free memory and try again.",
  "msg.readyNotice":
    "Download complete. You can now open a radiograph and run the model.",
  "msg.cancelled": "Processing cancelled. No partial result was presented.",
  "msg.cacheCleared": "The model weights were removed from this browser's cache.",
  "msg.cacheBlocked": "The browser does not allow cache access in this mode.",
  "msg.noOffline":
    "The browser did not enable offline mode. Local execution still works while online.",

  "worker.noCache":
    "Cache unavailable in this browser. Computation continues locally, but offline use will not be available.",
  "worker.noSpace":
    "No space for the cache. Computation continues; the weights will have to be downloaded again next time.",
  "worker.downloadFailed":
    "Failed to download network {fold} ({status}). Check your connection and try again.",
  "worker.badSize": "The model file has an unexpected size.",
  "worker.unavailable": "The model is not available in this installation.",
  "worker.badManifest": "Invalid model manifest.",
  "worker.noReference": "Preprocessing reference unavailable.",
  "worker.noContrast":
    "The crop has no contrast. Select the hand in the radiograph.",

  "worker.integrity":
    "The model integrity check failed. Try downloading it again.",
  "worker.badOutput": "The network returned an invalid result.",
  "worker.failed":
    "The model could not be run. The browser may be out of memory. Close other tabs and try again.",
  "decode.noPixels": "DICOM without image data.",
  "decode.truncated": "Truncated DICOM data.",
  "decode.tiffEmpty": "TIFF without an image.",
  "processing.emptyHistogram": "Empty histogram.",
  "decode.badSize": "Invalid dimensions, or image larger than 24 megapixels.",
  "decode.dicomUnreadable":
    "The DICOM could not be read. Use an original DICOM Part 10 file, PNG or TIFF.",
  "decode.dicomMultiframe":
    "Multiframe DICOM: export a single radiograph to analyse.",
  "decode.dicomMonochrome": "Use a monochrome DICOM of a hand radiograph.",
  "decode.dicomChannels": "Multi-channel DICOM is not supported.",
  "decode.dicomJpegSize": "DICOM and JPEG dimensions do not match.",
  "decode.dicomBits":
    "DICOM must have 8- or 16-bit integer pixels with standard alignment.",
  "decode.dicomLut": "VOI LUT with unsupported depth.",
  "decode.dicomWindow": "Invalid DICOM window.",
  "decode.empty": "The radiograph is empty or has constant contrast.",
  "decode.tooLarge": "The limit is 100 MB per image.",
  "decode.emptyFile": "The file is empty.",
  "decode.tiffPages":
    "Multi-page TIFF: export only the radiograph you want to analyse.",
  "decode.unknownFormat":
    "Format not recognised. Use DICOM, PNG, JPEG, TIFF, WebP, BMP or AVIF.",
  "decode.failed":
    "The image could not be decoded. Check the format and the size.",

  "processing.cropTooSmall":
    "Select a region of at least 32 × 32 pixels, inside the image.",
  "processing.badReference": "Invalid histogram reference.",
  "processing.badDates": "Enter valid dates.",
  "processing.birthAfterExam": "Birth cannot be later than the examination.",
  "processing.tooOld":
    "The model is paediatric. Check the dates (age up to 20 years).",

  "pdf.productName": "bone age",
  "pdf.title": "Bone age report",
  "pdf.subtitle":
    "Estimate produced locally in the browser, from a left-hand radiograph.",
  "pdf.generatedOn": "Generated on {datetime}",
  "pdf.ensembleCaption": "mean of the three networks",
  "pdf.sexLabel": "Biological sex",
  "pdf.dobLabel": "Date of birth",
  "pdf.fileLabel": "Source file",
  "pdf.imageSizeLabel": "Analysed image",
  "pdf.radiograph": "Analysed radiograph",
  "pdf.radiographCaption":
    "The crop submitted to the networks, already oriented. The image was never sent to a server.",
  "pdf.technical": "Execution",
  "pdf.ensembleMean": "Ensemble mean",
  "pdf.networkOutput": "Network {index}",
  "pdf.runtime": "Total time",
  "pdf.cropLabel": "Crop [x0, y0, x1, y1]",
  "pdf.modelLabel": "Model",
  "pdf.revisionLabel": "Revision",
  "pdf.environmentLabel": "Environment",
  "pdf.environmentValue": "ONNX FP32 · WebAssembly/CPU · browser",
  "pdf.preprocessingLabel": "Preprocessing",
  "pdf.preprocessingValue":
    "Local decoding, manual crop, histogram matching, bilinear interpolation, 512×512 padding.",
  "pdf.references": "References and credits",
  "pdf.refModel":
    "Model ianpan/bone-age, created and trained by Ian Pan — huggingface.co/ianpan/bone-age",
  "pdf.refArchitecture":
    "ConvNeXtV2-tiny architecture, three-network ensemble, 84.1M parameters.",
  "pdf.refDataset":
    "Trained on 14,036 hand radiographs from the RSNA Pediatric Bone Age Challenge 2017; published mean absolute error of 4.16 months on the test set.",
  "pdf.refLicense":
    "Weights redistributed under the Apache License 2.0, with a modification notice: converted to ONNX, not retrained.",
  "pdf.refApplication":
    "Application bone-age.app, code under the MIT licence — github.com/feliperun/bone-age",
  "pdf.disclaimerHeading": "Notice",
  "pdf.pageNumber": "{page}/{total}",
  "pdf.secondsValue": "{seconds} s",
  "pdf.cropValue": "{x0}, {y0}, {x1}, {y1}",
  "pdf.imageSizeValue": "{width} × {height} px",
  "msg.reportFailed":
    "The PDF could not be generated. Try again, or use another browser tab.",

  "report.filename": "bone-age",
  "report.notComputed": "not computed",
  "report.monthsValue": "{months} months",
  "report.disclaimer":
    "Experimental result. It is not a report and establishes no diagnosis. The published mean error is not an individual confidence interval.",
  "report.privacy": "No image or examination datum was sent to any server.",
};

export const dictionaries: Record<Lang, Record<Key, string>> = { pt, en };

const isLang = (value: unknown): value is Lang =>
  LANGUAGES.includes(value as Lang);

/** Stored choice first, then the browser's languages; Portuguese only on a pt match. */
export function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE);
    if (isLang(stored)) return stored;
  } catch {
    /* Storage can be blocked; fall through to the browser languages. */
  }
  for (const tag of navigator.languages?.length
    ? navigator.languages
    : [navigator.language]) {
    const code = tag?.toLowerCase().split("-")[0];
    if (isLang(code)) return code;
  }
  return "en";
}

let current: Lang = "pt";
export const lang = () => current;
export function setLang(value: Lang) {
  current = value;
}
export function t(key: Key, vars?: Record<string, string | number>): string {
  const text = dictionaries[current][key];
  return vars
    ? text.replace(/\{(\w+)\}/g, (match, name) =>
        name in vars ? String(vars[name]) : match,
      )
    : text;
}
