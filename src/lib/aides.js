// Les aides : une page sommaire (/aides/) et une page par aide (/aides/<slug>/).
// Tous les faits viennent du portail national pour-les-personnes-agees.gouv.fr (vérifiés le 14 novembre 2026).
// Les montants qui changent chaque année sont regroupés ici : SEUIL_APA.
import { esc, eur, int } from "./core.js";

export const CHECKED = "2026-11-14";
const SEUIL_APA = "2 846,77 €"; // revenus mensuels, valeur 2026
const P = "https://www.pour-les-personnes-agees.gouv.fr/vivre-dans-un-ehpad/aides-financieres-en-ehpad/";
const SIM = "https://www.pour-les-personnes-agees.gouv.fr";
const AJPA = "66,64 €"; // allocation journalière du proche aidant, montant par jour au 1er janvier 2026
const PA = "https://www.pour-les-personnes-agees.gouv.fr/solutions-pour-les-aidants/";

// Guide pour les proches aidants (page /aides/proches-aidants/), même mise en page qu'une aide.
export const AIDANTS = {
  id: "aidants", slug: "proches-aidants", name: "Proches aidants", full: "Guide", tag: "Pour la famille et les proches",
  title: "Proches aidants : vos droits quand un parent vit en EHPAD",
  desc: `Congé de proche aidant, allocation journalière (AJPA, ${AJPA} par jour), obligation alimentaire, déduction fiscale, plateformes de répit : ce qui existe pour les proches d'un résident d'EHPAD.`,
  lede: "Congé indemnisé, déduction d'impôt, soutien près de chez vous : ce qui existe pour celles et ceux qui accompagnent un proche âgé.",
  short: "Congé indemnisé, déduction d'impôt, lieux de soutien : vos droits quand vous accompagnez un proche.",
  brief: [["Le congé", "3 mois, jusqu'à 1 an sur la carrière"], ["L'indemnité", `${AJPA} par jour, 66 jours par proche`], ["Si vous payez l'EHPAD", "Somme déductible de vos revenus"], ["Le soutien", "220 plateformes de répit en France"]],
  sections: [
    ["Qui est proche aidant", `<p>La loi reconnaît comme proche aidant d'une personne âgée :</p><ul><li>son conjoint, son partenaire de PACS ou son concubin ;</li><li>un parent ou un allié : enfant, frère, sœur, gendre, belle-fille… ;</li><li>une personne qui vit avec elle ou entretient avec elle des liens étroits et stables.</li></ul><p>Il faut l'aider de manière régulière et fréquente, à titre non professionnel, dans les actes de la vie quotidienne.</p>`],
    ["Prendre un congé", `<p>Le congé de proche aidant permet de suspendre ou de réduire son activité professionnelle pour accompagner un proche. <b>Il reste possible quand ce proche vit en établissement.</b></p>
      <ul><li><b>Pour qui :</b> salariés, agents publics, indépendants et demandeurs d'emploi indemnisés.</li><li><b>Durée :</b> 3 mois au plus, renouvelable, dans la limite d'un an sur toute la carrière.</li><li><b>Souplesse :</b> il peut être fractionné, ou transformé en temps partiel avec l'accord de l'employeur.</li><li><b>Emploi :</b> le maintien dans l'emploi est garanti.</li></ul>
      <p>Le proche aidé doit bénéficier de l'APA (GIR 1 à 4) ou avoir un taux d'incapacité d'au moins 80 %. Les salariés font la demande à leur employeur par lettre recommandée.</p>`],
    ["Être indemnisé", `<p>Le congé est indemnisé par l'allocation journalière du proche aidant (AJPA), versée par la CAF ou la MSA.</p>
      <div class="callout"><b>${AJPA} par jour (montant au 1er janvier 2026)</b><p>Elle peut être versée par demi-journées, dans la limite de 66 jours par proche accompagné, et de 4 proches (264 jours) sur toute la carrière.</p></div>
      <p>Un retraité sans activité professionnelle n'y a pas droit. La demande se fait sur le site de la CAF ou de la MSA.</p>`],
    ["Si vous participez aux frais", `<p>L'obligation alimentaire est le devoir d'aider un membre de sa famille dans le besoin. Elle existe entre parents et enfants, entre grands-parents et petits-enfants, et entre gendres ou belles-filles et beaux-parents. Entre époux, on parle de devoir de secours.</p>
      <p>Elle peut conduire à payer une partie des frais d'hébergement d'un proche en EHPAD, notamment lors d'une demande d'<a href="/aides/aide-sociale-hebergement-ash/">aide sociale à l'hébergement</a>. La participation dépend de vos ressources.</p>
      <ul><li><b>Déduction d'impôt.</b> Ce que vous versez pour l'hébergement de votre parent, dans le cadre de l'obligation alimentaire, est déductible de vos revenus au titre des pensions alimentaires.</li><li><b>Dispenses.</b> Les petits-enfants ne sont pas sollicités pour une demande d'aide sociale à l'hébergement. Les enfants retirés de leur famille par un juge pendant au moins 36 mois avant leurs 18 ans sont dispensés.</li></ul>`],
    ["Trouver du soutien", `<p>Il existe 220 plateformes d'accompagnement et de répit en France. Elles s'adressent aux proches d'une personne âgée en perte d'autonomie.</p>
      <ul><li>Information, écoute et conseils, gratuitement.</li><li>Groupes d'échanges entre aidants et formations.</li><li>Aide dans les démarches et recherche de solutions de répit.</li></ul>
      <p>Une participation peut être demandée pour certaines activités. Pour trouver la plus proche, consultez l'<a href="https://www.pour-les-personnes-agees.gouv.fr" target="_blank" rel="noopener">annuaire des points d'information locaux</a> du portail national.</p>`],
    ["À savoir", `<ul><li><b>Retraite.</b> L'assurance vieillesse des aidants permet, sous conditions, de valider des trimestres quand on réduit ou cesse son activité pour aider un proche.</li><li><b>Don de jours.</b> Des collègues peuvent vous donner des jours de repos, pour que vous restiez payé pendant que vous accompagnez votre proche.</li><li><b>Caisses de retraite et mutuelles.</b> Certaines proposent des services ou des aides aux proches aidants : posez-leur la question.</li></ul>`],
  ],
  faq: [
    ["Peut-on prendre un congé de proche aidant si le proche vit en EHPAD ?", "Oui. Le proche aidé peut vivre à domicile ou en établissement. Il doit bénéficier de l'APA (GIR 1 à 4) ou avoir un taux d'incapacité d'au moins 80 %."],
    ["Un retraité peut-il toucher l'allocation journalière du proche aidant ?", "Non, s'il n'exerce aucune activité professionnelle. S'il travaille en complément de sa retraite, il doit cesser ou réduire cette activité pour en bénéficier."],
    ["Les enfants doivent-ils payer l'EHPAD de leurs parents ?", "Ils peuvent être mis à contribution au titre de l'obligation alimentaire, selon leurs ressources, quand le parent ne peut pas payer seul. Les sommes versées sont déductibles de leurs revenus au titre des pensions alimentaires."],
  ],
  src: ["Aidant familial, proche aidant : quelles définitions et quelles aides", PA + "trouver-du-soutien/aidant-familial-proche-aidant-quelles-definitions-et-quelles-aides"],
  src2: ["Le congé de proche aidant", PA + "travailler-et-aider-un-proche/le-conge-de-proche-aidant"],
  links: [["Quelles aides pour payer un EHPAD ?", "/aides/"]],
};

export function aides({ nat, dep }) {
  const [na, ma] = nat.ash;
  return [
    {
      id: "apa", slug: "apa-en-ehpad", name: "APA en établissement", full: "Allocation personnalisée d'autonomie", tag: "Si GIR 1 à 4",
      title: "APA en EHPAD : pour qui, combien, comment la demander",
      desc: `L'APA en établissement paie une partie du tarif dépendance de l'EHPAD, pour les 60 ans et plus en GIR 1 à 4. Conditions, calcul, seuil de ${SEUIL_APA} et démarches.`,
      lede: "L'allocation personnalisée d'autonomie aide à payer le tarif dépendance facturé par l'EHPAD.",
      short: "Elle paie le supplément de dépendance au-delà du tarif minimum (GIR 5-6).",
      brief: [["Pour qui", "60 ans ou plus, en GIR 1 à 4"], ["Ce qu'elle paie", "Le tarif dépendance au-delà du GIR 5-6"], ["Où la demander", "À la direction de l'EHPAD"], ["Versée par", "Le département"]],
      sections: [
        ["Pour qui", `<p>Trois conditions sont à remplir :</p><ul><li>avoir 60 ans ou plus ;</li><li>résider en France de façon stable et régulière ;</li><li>avoir une perte d'autonomie évaluée en GIR 1, 2, 3 ou 4.</li></ul>
          <p>Le GIR est évalué après l'entrée dans l'établissement par le médecin coordonnateur, avec l'équipe soignante. Il existe six niveaux : le GIR 1 correspond à la perte d'autonomie la plus forte, le GIR 6 à la plus faible. Les personnes en GIR 5 ou 6 n'ont pas droit à l'APA.</p>`],
        ["Ce qu'elle apporte", `<p>Chaque EHPAD a trois tarifs dépendance : le plus élevé pour les GIR 1-2, un tarif intermédiaire pour les GIR 3-4, et le moins élevé pour les GIR 5-6.</p>
          <div class="callout"><b>Si vos revenus sont inférieurs à ${SEUIL_APA} par mois (seuil 2026)</b><p>Vous payez seulement le tarif GIR 5-6. L'APA paie toute la différence avec le tarif de votre GIR.</p></div>
          <p>Au-dessus de ce seuil, une partie de cette différence reste à votre charge, d'autant plus grande que vos revenus sont élevés. Le montant dépend de vos ressources, du tarif dépendance de l'établissement et de votre GIR.</p>
          <p>Le tarif GIR 5-6 est déjà compté dans les prix par mois affichés sur EHPAD Arena. En France, il est de <b>${eur(dep)} par mois</b> (valeur médiane).</p>`],
        ["Comment la demander", `<ol><li>Une fois l'établissement choisi, adressez-vous à sa direction : elle indique les formalités.</li><li>Le département verse l'APA dès que le dossier complet est enregistré.</li><li>Elle est versée directement à l'établissement, qui la déduit de la facture, ou à vous, qui la reversez.</li></ol>`],
        ["À savoir", `<ul><li><b>Pas de récupération.</b> Le département ne peut pas réclamer les sommes versées, ni de votre vivant ni sur votre succession.</li><li><b>Pas d'impôt.</b> L'APA est exonérée : elle n'est pas à déclarer.</li><li><b>Pas de cumul</b> avec l'APA à domicile, la prestation de compensation du handicap (PCH) ou la majoration pour tierce personne.</li><li><b>Carte mobilité inclusion.</b> En GIR 1 ou 2, vous pouvez obtenir sur demande la carte invalidité et la carte de stationnement.</li><li><b>23 départements</b> testent depuis juillet 2025 un forfait unique qui réunit les soins et la dépendance.</li></ul>`],
      ],
      faq: [
        ["L'APA est-elle récupérée sur la succession ?", "Non. L'APA ne fait l'objet d'aucune récupération, ni du vivant du bénéficiaire ni à son décès."],
        ["Faut-il déclarer l'APA aux impôts ?", "Non, l'APA est exonérée d'impôt. En revanche, si vous demandez la réduction d'impôt pour frais d'EHPAD, l'APA reçue est à soustraire des dépenses déclarées."],
        ["Peut-on toucher l'APA en GIR 5 ou 6 ?", "Non. Seules les personnes évaluées en GIR 1 à 4 peuvent en bénéficier."],
      ],
      src: ["L'APA en établissement", P + "l-apa-en-etablissement"],
      links: [["Combien coûte un EHPAD en France ?", "/actualites/prix-ehpad-france/"]],
    },
    {
      id: "logement", slug: "aide-au-logement-ehpad", name: "Aide au logement", full: "APL ou ALS", tag: "Selon vos revenus",
      title: "APL et ALS en EHPAD : l'aide au logement",
      desc: "APL ou ALS en EHPAD : conditions de ressources, différence entre les deux aides, demande à la CAF ou à la MSA, versement chaque mois.",
      lede: "L'APL ou l'ALS réduit chaque mois le prix de l'hébergement, selon vos revenus.",
      short: "Elle réduit le prix de l'hébergement chaque mois.",
      brief: [["Pour qui", "Résidents aux revenus modestes"], ["Ce qu'elle paie", "Une partie de l'hébergement"], ["Où la demander", "À la CAF ou à la MSA"], ["Versée", "Chaque mois"]],
      sections: [
        ["Pour qui", `<p>Vous pouvez en bénéficier en EHPAD si :</p><ul><li>vos ressources ne dépassent pas un certain plafond ;</li><li>vous résidez de manière stable en France ;</li><li>vous êtes en situation régulière sur le territoire.</li></ul>`],
        ["APL ou ALS ?", `<p>Cela dépend de l'établissement, pas de vous :</p><ul><li><b>APL</b> (aide personnalisée au logement) si l'EHPAD est conventionné APL ;</li><li><b>ALS</b> (allocation de logement sociale) s'il ne l'est pas.</li></ul><p>Les deux aides ne se cumulent pas.</p>`],
        ["Comment la demander", `<ol><li>Remplissez le formulaire de demande d'aide au logement. Il se télécharge sur le site de la CAF ; le secrétariat de l'établissement peut aussi vous le remettre.</li><li>Faites remplir, dater et signer par le responsable de l'EHPAD l'attestation de résidence incluse dans le formulaire.</li><li>Envoyez le dossier à la CAF, ou à la MSA si vous relevez du régime agricole.</li></ol><p>Le site de la CAF propose une simulation du montant.</p>`],
        ["Comment elle est versée", `<ul><li><b>APL</b> : tous les mois, directement à l'établissement, qui la déduit de la facture.</li><li><b>ALS</b> : tous les mois, sur votre compte bancaire ou directement à l'établissement.</li></ul>`],
        ["À savoir", `<ul><li>L'aide au logement se cumule avec l'APA et l'aide sociale à l'hébergement.</li><li>Si vous demandez la réduction d'impôt pour frais d'EHPAD, l'aide au logement reçue est à soustraire des dépenses déclarées.</li></ul>`],
      ],
      faq: [
        ["Peut-on cumuler l'APL et l'ALS ?", "Non. L'APL concerne les établissements conventionnés APL, l'ALS les autres."],
        ["Où demander l'aide au logement en EHPAD ?", "Auprès de la CAF, ou de la MSA pour les retraités du régime agricole."],
      ],
      src: ["Vivre en établissement et demander l'APL ou l'ALS", P + "vivre-en-etablissement-et-faire-une-demande-d-apl-ou-d-als"],
      links: [["Combien coûte un EHPAD en France ?", "/actualites/prix-ehpad-france/"]],
    },
    {
      id: "ash", slug: "aide-sociale-hebergement-ash", name: "Aide sociale à l'hébergement", full: "ASH", tag: "Si vos revenus ne suffisent pas",
      title: "Aide sociale à l'hébergement (ASH) en EHPAD",
      desc: "L'ASH paie la part de l'hébergement en EHPAD que vous ne pouvez pas payer : conditions, EHPAD habilités, obligation alimentaire, récupération sur succession, demande.",
      lede: "Le département paie la part de l'hébergement que vos revenus ne couvrent pas. C'est une avance, récupérable sous conditions.",
      short: "Le département paie la part de l'hébergement que vous ne pouvez pas payer.",
      brief: [["Pour qui", "Revenus inférieurs au prix de l'hébergement"], ["Condition", "Un EHPAD habilité à l'aide sociale"], ["Où la demander", "À la mairie ou au CCAS"], ["À noter", "Avance récupérable"]],
      sections: [
        ["Pour qui", `<ul><li>avoir plus de 65 ans, ou plus de 60 ans si vous êtes reconnu inapte au travail ;</li><li>résider en France de façon stable et régulière, ou avoir un titre de séjour valide ;</li><li>avoir des ressources inférieures au montant des frais d'hébergement.</li></ul>`],
        ["Dans quels EHPAD", `<p>L'établissement doit avoir des places habilitées à l'aide sociale. C'est un critère à regarder avant de choisir : sur EHPAD Arena, chaque fiche indique si l'établissement est habilité.</p>
          <p><b>${int(nat.nash)} EHPAD sur ${int(nat.n)}</b> sont habilités, en totalité ou en partie. Leur prix médian est de ${eur(ma)} par mois.</p>
          <p>Exception : après 5 ans passés dans un établissement non habilité sans aide sociale, le département peut participer à vos frais si vous en avez désormais besoin.</p>`],
        ["Ce qu'elle apporte", `<p>Le département paie la différence entre la facture de l'établissement et ce que vous pouvez payer, vous et, le cas échéant, vos obligés alimentaires.</p>
          <ul><li>Elle couvre une partie ou la totalité des frais d'hébergement.</li><li>Elle peut aussi, sous conditions, couvrir le tarif dépendance.</li><li>Vos revenus servent d'abord à payer l'établissement ; une petite partie reste à votre disposition.</li></ul>`],
        ["La famille doit-elle payer ?", `<p>Les obligés alimentaires, en premier lieu les enfants, peuvent être sollicités selon leurs moyens. Les petits-enfants en sont dispensés.</p>`],
        ["Comment la demander", `<ol><li>Déposez le dossier au centre communal d'action sociale (CCAS) ou à la mairie.</li><li>La mairie le transmet au département, qui décide.</li></ol>`],
        ["Ce que le département peut récupérer", `<p>L'ASH est une avance. Le département peut récupérer les sommes versées dans trois cas :</p>
          <ul><li><b>Au décès, sur la succession.</b> Seul le patrimoine laissé par la personne est concerné, pas celui des héritiers. S'il n'y a pas de succession, rien n'est récupéré.</li><li><b>De votre vivant, si votre situation s'améliore</b>, par exemple après un héritage.</li><li><b>Sur une donation</b> faite dans les 10 ans avant la demande, ou après.</li></ul>`],
      ],
      faq: [
        ["L'aide sociale à l'hébergement est-elle remboursable ?", "Oui, sous conditions. Le département peut récupérer les sommes sur la succession du bénéficiaire, sur une donation faite dans les 10 ans avant la demande ou après, ou de son vivant si sa situation financière s'améliore."],
        ["Les petits-enfants doivent-ils payer ?", "Non. Les petits-enfants sont dispensés de l'obligation alimentaire pour une demande d'aide sociale à l'hébergement."],
        ["Peut-on avoir l'ASH dans un EHPAD non habilité ?", "En principe non. Exception : après 5 ans passés dans l'établissement sans aide sociale, le département peut participer aux frais d'hébergement."],
      ],
      src: ["L'aide sociale à l'hébergement (ASH) en établissement", P + "l-aide-sociale-a-l-hebergement-ash-en-etablissement"],
      src2: ["La récupération de l'aide sociale à l'hébergement", P + "la-recuperation-de-l-aide-sociale-a-l-hebergement"],
      links: [["EHPAD habilités à l'aide sociale : moins chers ?", "/actualites/prix-ehpad-aide-sociale/"]],
    },
    {
      id: "impot", slug: "reduction-impot-ehpad", name: "Réduction d'impôt", full: "Frais de dépendance et d'hébergement", tag: "Si vous êtes imposable",
      title: "Réduction d'impôt pour frais d'EHPAD",
      desc: "Réduction d'impôt de 25 % des frais de dépendance et d'hébergement en EHPAD, jusqu'à 2 500 € par an : dépenses retenues, calcul, cases à remplir.",
      lede: "25 % des frais de dépendance et d'hébergement payés dans l'année, jusqu'à 2 500 € par personne hébergée.",
      short: "25 % des frais payés, jusqu'à 2 500 € par an et par personne hébergée.",
      brief: [["Pour qui", "Résidents imposables"], ["Montant", "25 % des frais, 2 500 € au plus"], ["Où la demander", "Dans la déclaration de revenus"], ["Cases", "7CD et 7CE"]],
      sections: [
        ["Pour qui", `<p>Vous vivez en EHPAD et vous payez l'impôt sur le revenu. Il n'y a pas de condition d'âge.</p><p>C'est une réduction, pas un crédit d'impôt : elle ne profite pas aux personnes non imposables.</p>`],
        ["Les dépenses retenues", `<ul><li>les frais liés à la dépendance ;</li><li>les frais d'hébergement, à condition qu'ils s'ajoutent à des frais de dépendance.</li></ul><p>Les dépenses de soins ne comptent pas. Il faut soustraire les aides reçues : APA et aide au logement.</p>`],
        ["Le calcul", `<p>La réduction est de 25 % des sommes payées dans l'année, retenues dans la limite de 10 000 € par personne hébergée. Elle est donc de <b>2 500 € au plus</b> par an et par personne.</p>
          <div class="callout"><b>Exemple</b><p>Vous avez payé 8 000 € dans l'année, aides déduites. La réduction possible est de 2 000 €. Si votre impôt est de 500 €, il tombe à 0 € ; les 1 500 € restants ne sont pas remboursés.</p></div>`],
        ["Comment la demander", `<ol><li>L'année suivante, reportez le montant payé, aides déduites, cases 7CD et 7CE de la déclaration 2042 RICI.</li><li>En janvier, vous recevez une avance de 60 % de la réduction obtenue l'année précédente. Elle est régularisée la même année, au calcul de l'impôt.</li></ol>`],
        ["À savoir", `<ul><li>Dans un couple marié ou pacsé, la réduction se cumule avec le crédit d'impôt pour l'emploi d'un salarié à domicile, quand l'un vit en EHPAD et que l'autre est aidé chez lui.</li></ul>`],
      ],
      faq: [
        ["Quel est le montant maximum de la réduction d'impôt en EHPAD ?", "2 500 € par an et par personne hébergée, soit 25 % de 10 000 € de dépenses."],
        ["La réduction d'impôt est-elle remboursée si je ne paie pas d'impôt ?", "Non. Si la réduction dépasse le montant de l'impôt, celui-ci est ramené à 0 € et le surplus n'est pas remboursé."],
      ],
      src: ["La réduction d'impôt en établissement d'hébergement", P + "la-reduction-d-impot-en-etablissement-d-hebergement"],
      links: [["Combien coûte un EHPAD en France ?", "/actualites/prix-ehpad-france/"]],
    },
  ];
}

const dateFr = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const simBox = `<div class="sim"><div><b>Combien vous restera-t-il à payer ?</b><p>Le simulateur officiel calcule votre reste à charge dans un EHPAD précis, après APA et aide au logement.</p></div><a class="btn" href="${SIM}" target="_blank" rel="noopener">Ouvrir le simulateur ↗</a></div>`;

// ---------- sommaire ----------
export function renderAidesHub({ A, heb, dep, med }) {
  const w = (heb / (heb + dep)) * 100;
  const link = (id) => "/aides/" + A.find((a) => a.id === id).slug + "/";
  const STEPS = [
    ["Avant de choisir", "Si vos revenus risquent de ne pas suffire, choisissez un EHPAD habilité à l'aide sociale : c'est indiqué sur chaque fiche."],
    ["À l'entrée", "Demandez l'APA à la direction de l'EHPAD et l'aide au logement à la CAF ou à la MSA."],
    ["Si le reste à payer est trop lourd", "Déposez une demande d'aide sociale à l'hébergement à la mairie."],
    ["Chaque année", "Déclarez les frais payés dans votre déclaration de revenus pour la réduction d'impôt."],
  ];
  return `<section class="band ill"><div class="wrap"><h1>Quelles aides pour payer un EHPAD ?</h1><p class="lede">Quatre aides réduisent la facture d'une maison de retraite médicalisée. Elles peuvent se cumuler.</p></div></section>
<section class="block"><div class="wrap">
  <h2>Les 4 aides</h2>
  <ul class="rows">${A.map((a) => `<li id="${a.id}"><a href="/aides/${a.slug}/"><span class="rw-t"><b>${a.name}</b><small>${a.full}</small></span><span class="rw-m"><em>${a.tag}</em>${a.short}</span><span class="rw-go">Tout savoir <i>→</i></span></a></li>`).join("")}</ul>
</div></section>
<section class="block"><div class="wrap">
  <h2>Vous accompagnez un proche ?</h2>
  <ul class="rows"><li id="aidants"><a href="/aides/${AIDANTS.slug}/"><span class="rw-t"><b>${AIDANTS.name}</b><small>Vos droits et vos soutiens</small></span><span class="rw-m"><em>${AIDANTS.tag}</em>${AIDANTS.short}</span><span class="rw-go">Lire le guide <i>→</i></span></a></li></ul>
</div></section>
<section class="block"><div class="wrap">
  <h2>Ce que couvre chaque aide</h2>
  <div class="card pad bill">
    <p class="k">Une facture type : environ ${eur(Math.round(med / 50) * 50)} par mois</p>
    <div class="bill-bar" role="img" aria-label="Hébergement ${eur(heb)}, dépendance ${eur(dep)}"><i class="b-h" style="width:${w.toFixed(1)}%"></i><i class="b-d"></i></div>
    <div class="bill-leg">
      <div><span class="sw b-h"></span><div><b>Hébergement · ${eur(heb)}</b><p>Le logement, les repas, l'entretien, l'animation. Réduit par l'<a href="${link("logement")}">aide au logement</a> et l'<a href="${link("ash")}">aide sociale</a>.</p></div></div>
      <div><span class="sw b-d"></span><div><b>Dépendance · ${eur(dep)}</b><p>L'aide à la toilette, aux repas, aux déplacements. Ce montant est le minimum payé par tous (tarif GIR 5-6). Au-delà, l'<a href="${link("apa")}">APA</a> paie le supplément.</p></div></div>
      <div><span class="sw b-t"></span><div><b>Après la facture</b><p>Ce qui reste payé ouvre droit à la <a href="${link("impot")}">réduction d'impôt</a>.</p></div></div>
    </div>
    <p class="src">Valeurs médianes des prix déclarés à la CNSA pour une chambre seule. Les soins médicaux sont payés par l'Assurance maladie et ne figurent pas sur la facture.</p>
  </div>
</div></section>
<section class="block"><div class="wrap">
  <h2>Dans quel ordre faire les démarches</h2>
  <ol class="asteps">${STEPS.map((x, i) => `<li><span class="n">${i + 1}</span><div><b>${x[0]}</b><p>${x[1]}</p></div></li>`).join("")}</ol>
  ${simBox}
  <p class="src" style="margin-top:14px">Source : portail national pour-les-personnes-agees.gouv.fr. Informations vérifiées le ${dateFr(CHECKED)}.</p>
</div></section>`;
}

// ---------- page d'une aide ----------
export function renderAide({ a, A }) {
  const others = A.filter((x) => x.id !== a.id);
  const anchor = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `<section class="band"><div class="wrap"><p class="crumb"><a href="/">Accueil</a><span>›</span><a href="/aides/">Les aides</a></p>
  <p class="kicker">${a.full} · ${a.tag}</p><h1>${esc(a.title).replace(" : ", "&nbsp;: ")}</h1><p class="lede">${a.lede}</p></div></section>
<section class="block"><div class="wrap doc">
  <aside class="doc-side">
    <div class="brief"><h2>En bref</h2><dl>${a.brief.map((b) => `<div><dt>${b[0]}</dt><dd>${b[1]}</dd></div>`).join("")}</dl></div>
    <nav class="toc" aria-label="Sur cette page"><b>Sur cette page</b>${a.sections.map((s) => `<a href="#${anchor(s[0])}">${s[0]}</a>`).join("")}<a href="#questions">Questions fréquentes</a></nav>
  </aside>
  <article class="doc-main">
    ${a.sections.map((s) => `<section id="${anchor(s[0])}"><h2>${s[0]}</h2>${s[1]}</section>`).join("")}
    <section id="questions"><h2>Questions fréquentes</h2><div class="faq">${a.faq.map((f) => `<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join("")}</div></section>
    <p class="doc-src">Source officielle : <a href="${a.src[1]}" target="_blank" rel="noopener">${esc(a.src[0])}</a>${a.src2 ? ` et <a href="${a.src2[1]}" target="_blank" rel="noopener">${esc(a.src2[0])}</a>` : ""}, pour-les-personnes-agees.gouv.fr. Informations vérifiées le ${dateFr(CHECKED)}. Votre situation peut comporter des cas particuliers : le département, la CAF ou le centre des impôts vous renseignent.</p>
    ${simBox}
  </article>
</div></section>
<section class="block"><div class="wrap">
  <h2>${a.id === "aidants" ? "Les aides pour payer un EHPAD" : "Les autres aides"}</h2>
  <ul class="rows">${others.map((o) => `<li><a href="/aides/${o.slug}/"><span class="rw-t"><b>${o.name}</b><small>${o.full}</small></span><span class="rw-m"><em>${o.tag}</em>${o.short}</span><span class="rw-go">Tout savoir <i>→</i></span></a></li>`).join("")}</ul>
  <div class="go"><div class="go-l">${a.links.map((l) => `<a href="${l[1]}">${esc(l[0])} →</a>`).join("")}${a.id === "aidants" ? "" : `<a href="/aides/${AIDANTS.slug}/">Le guide des proches aidants →</a>`}<a href="/">Trouver un EHPAD près de chez vous →</a></div></div>
</div></section>`;
}

export function aideLd({ a, url, site }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: a.title, description: a.desc, datePublished: CHECKED, dateModified: CHECKED, inLanguage: "fr-FR", mainEntityOfPage: url, image: site + "/og.png", author: { "@type": "Organization", name: "EHPAD Arena", url: site + "/" }, publisher: { "@type": "Organization", name: "EHPAD Arena", url: site + "/" } },
      { "@type": "BreadcrumbList", itemListElement: [["Accueil", site + "/"], ["Les aides", site + "/aides/"], [a.name, url]].map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x[0], item: x[1] })) },
      { "@type": "FAQPage", mainEntity: a.faq.map((f) => ({ "@type": "Question", name: f[0], acceptedAnswer: { "@type": "Answer", text: f[1] } })) },
    ],
  };
}
