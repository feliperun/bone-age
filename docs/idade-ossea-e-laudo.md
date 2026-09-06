# Idade óssea: métodos, laudo e limites do produto

Pesquisa consultada em 6 de setembro de 2026. O exemplo abaixo é uma proposta
didática de estrutura, não um laudo emitido nem um template oficial de sociedade.

## O que dizem as sociedades

A RSNA e a European Society of Radiology apoiam o uso de relatórios estruturados:
informações consistentes, legíveis e suficientemente completas para comunicar
os achados. A biblioteca RadReport reúne exemplos de boas práticas; isso não
equivale a um protocolo único obrigatório para todos os exames. Não foi confirmado
nesta pesquisa um template específico vigente de idade óssea no RadReport, nem
uma norma pública específica do CBR que imponha um texto universal para esse laudo.
Isso é uma limitação da busca, não prova de inexistência.
[RSNA: RadReport](https://www.rsna.org/practice-tools/data-tools-and-standards/radreport-reporting-templates),
[RSNA/ESR: objetivos da iniciativa](https://www.rsna.org/news/2015/may/technology-makes-radiology-reports-easier).

O ACR mantém um parâmetro geral para comunicação de achados de imagem, com seções
sobre componentes do relatório, relatório final e comunicações preliminares.
O índice foi localizado, mas os links de acesso ao documento integral retornaram
erro/redirecionamento durante a consulta; por isso não atribuímos ao ACR uma lista
específica de campos de idade óssea.
[ACR: Communication of Diagnostic Imaging Findings](https://gravitas.acr.org/PPTS/GetDocumentView?docId=74).

## Como se avalia

Greulich–Pyle (GP) compara a radiografia de mão e punho esquerdos com padrões de
atlas. Tanner–Whitehouse (TW, incluindo TW3) avalia estágios de maturação de ossos
definidos e converte escores em idade. São métodos diferentes; o relatório deve
identificar aquele realmente utilizado. GP tem variabilidade entre leitores e
limitações da população histórica de referência. Um estudo publicado na RSNA
discute essas diferenças; publicação científica não é uma diretriz da sociedade.
[Pan et al., Radiology: Artificial Intelligence, 2020](https://pubs.rsna.org/doi/10.1148/ryai.2020190198).

A recomendação histórica da Sociedade de Pediatria de São Paulo descreve o uso
convencional da mão esquerda alinhada ao punho e a observação dos núcleos de
ossificação do rádio/ulna, metacarpos/falanges e carpo. Registra que fatores
genéticos, ambientais e endócrinos influenciam a maturação. É material de pediatria
de 2009, não um protocolo radiológico novo.
[SPSP: Idade óssea e distúrbios do crescimento](https://www.spsp.org.br/site/asp/recomendacoes/021609_Rec_38_IdadeOssea.pdf).

## Sexo, idade e contexto

| Informação | Papel na avaliação | Situação no aplicativo |
| --- | --- | --- |
| Sexo usado na referência | Os padrões de maturação e a estimativa dependem dele. | Entrada efetiva do modelo. |
| Nascimento e data do exame | Determinam a idade cronológica na aquisição, para comparação. | Comparação descritiva; não alteram a inferência. |
| Referência normativa por idade e sexo | Permite contextualizar a diferença entre as idades. | Não implementada; sem z-score ou classificação clínica. |
| Crescimento, puberdade, histórico e tratamentos | Ajudam a interpretar o significado do achado. | Não coletados nem avaliados. |
| Qualidade da imagem e recorte | Condicionam o que pode ser avaliado. | Confirmação manual; sem validação automática de anatomia. |

Uma diferença fixa de meses não substitui uma referência adequada. Um estudo de
validação publicado em Radiology usa a classificação relativa a dois desvios
padrão da referência de GP e mostra vieses por sexo, faixa etária e maturação
sexual em um modelo de IA. Essa evidência não valida o modelo deste aplicativo.
O desvio padrão normativo e o erro de predição são grandezas distintas.
[RSNA: Generalizability and Bias, 2022/2023](https://pubs.rsna.org/doi/10.1148/radiol.220505).

O contexto influencia a interpretação: por exemplo, maturação atrasada pode
acompanhar atraso constitucional, hipotireoidismo, desnutrição, doenças crônicas
ou uso prolongado de corticoides; maturação adiantada pode acompanhar puberdade
precoce. A radiografia isolada não distingue essas causas.
[SPSP: recomendações de endocrinologia](https://www.spsp.org.br/site/asp/recomendacoes/021609_Rec_38_IdadeOssea.pdf).

## Estrutura didática de um laudo profissional

Proposta de organização baseada nos princípios de relato estruturado da RSNA e
nos métodos acima, a ser preenchida e validada por um radiologista:

> **Exame:** radiografia de mão e punho [lado], [incidência efetivamente adquirida].
>
> **Identificação e contexto:** identificação do paciente; nascimento; sexo usado
> na referência; data do exame; idade cronológica calculada nessa data;
> indicação clínica e exame anterior, quando disponíveis.
>
> **Técnica e método:** qualidade/limitações relevantes; método e edição/referência
> realmente utilizados, ou identificação do sistema automatizado e revisão médica.
>
> **Análise:** idade óssea estimada em anos e meses; eventual heterogeneidade de
> maturação ou outros achados realmente observados. Comparação com exames
> anteriores, se disponíveis e comparáveis.
>
> **Comparação:** diferença IO − IC; referência normativa e intervalo por sexo e
> idade, se aplicáveis e disponíveis. Não preencher desvios padrão presumidos.
>
> **Conclusão:** síntese da maturação estimada e de sua relação com a referência
> utilizada, com as limitações pertinentes.
>
> **Responsável:** identificação, registro profissional, data e assinatura do
> médico responsável pelo laudo.

Não inserir automaticamente “sem alterações”, “fises abertas”, “crescimento
remanescente de X cm” ou uma causa clínica: o modelo atual não fornece esses achados.

## Decisões implementadas no produto

Tela e PDF compartilham resumo, arredondamento, dados do exame, escala descritiva,
imagem orientada/recortada, execução e referências. Os formatos continuam
identificados como experimentais. O PDF mantém a paginação e o convite com QR;
a web adapta os mesmos conteúdos a celular e desktop.

A documentação do autor descreve um ensemble de três redes, condicionado à imagem
e ao sexo, treinado/validado com dados do desafio RSNA. O MAE de 4,16 meses foi
publicado para 200 imagens de teste com recorte e ajuste de histograma; não é uma
margem de erro individual nem uma validação clínica local. A saída não equivale
a uma leitura manual de GP ou TW3.
[Model card de ianpan/bone-age](https://huggingface.co/ianpan/bone-age).

Os gráficos não apresentam uma faixa de normalidade. A concordância entre as
três redes também não vira intervalo de confiança. A legenda da radiografia
esclarece que o preview é anterior ao ajuste de histograma e redimensionamento.
Uma futura classificação clínica exigiria selecionar e validar referências
normativas e um fluxo de revisão especializado; essa pesquisa não introduz tal
classificação no aplicativo.
