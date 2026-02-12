/**
 * Update abstracts for seeded articles with full text from Markdown sources.
 * Run: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/update-abstracts.ts
 */
import { db } from "../lib/db";
import { submissions } from "../lib/db/schema";
import { eq, like } from "drizzle-orm";

const updates: { titlePrefix: string; abstract: string }[] = [
  {
    titlePrefix: "Monitoring and Scalability",
    abstract: `High-load systems require monitoring to ensure user satisfaction with service quality and service level in real time. The purpose of this article is to analyze the operational response to peak-load situations in a high-load system in real time, as well as its scalability. Methods of systems analysis and an evidence-based approach to metrics accounting for user requirements are employed. Results include: an analysis of the capabilities of proactive and predictive monitoring; proposed procedures for anomaly detection and ranking of factors by consumer importance; and a mathematical model of system throughput with a test example. Practical implications of the results are indicated.`,
  },
  {
    titlePrefix: "Diagnostic Capabilities",
    abstract: `The achievement of peak athletic performance while preserving athlete health requires coordinated functioning of organs and systems at multiple physiological levels. This article examines the diagnostic capabilities of modern hardware-software systems applied in sports medicine for comprehensive assessment of athlete functional status. The study addresses three principal domains: (1) psychophysiological assessment, including cognitive function evaluation, motor and sensory analyzer testing, and psychological status profiling; (2) current functional state evaluation using heart rate variability (HRV) analysis in accordance with the International Standard (Task Force of ESC and NASPE, 1996), incorporating cross-analysis of HRV and respiratory cycle duration variability (RCDV); and (3) physical work capacity assessment through stress ergometry with individualized training load optimization. The multi-level diagnostic approach encompasses spectral analysis of cardiac rhythm, autonomic nervous system balance evaluation through orthostatic testing, and real-time ECG radiotelemetry monitoring during training sessions. Key findings demonstrate that HRV spectral power dynamics serve as early prognostic indicators of maladaptation and overtraining, detectable one to three weeks before decline in athletic performance.`,
  },
  {
    titlePrefix: "Finger Dermatoglyphics",
    abstract: `This article presents findings from over 13 years of research examining the association between finger dermatoglyphic traits — morphogenetic markers — and diverse manifestations of physical abilities in elite athletes, non-athletes, and individuals with congenital motor impairments. The study encompassed more than 2,000 subjects, including 1,559 athletes across 25 sports disciplines, 69 individuals with cerebral palsy, 202 university students, and 291 children and adolescents. Results demonstrate that finger dermatoglyphic traits serve as markers for the preferential development of specific physical qualities, energy supply mechanisms of motor activity, and the risk of diminished physical potential. A systematic pattern was identified: D10, TRC, and whorl frequency increase progressively from cyclic speed-strength sports through cyclic endurance sports to acyclic coordination-dominant sports. The dermatoglyphic phenotyping method is proposed as a rapid, non-invasive tool for early talent identification, sport-specific selection, playing position assignment, and individualization of training methods.`,
  },
  {
    titlePrefix: "Laboratory Assessment of Aerobic",
    abstract: `Greco-Roman wrestling demands a complex interplay of aerobic and anaerobic energy systems. The purpose of this study was to conduct a comprehensive laboratory assessment of both aerobic and anaerobic performance capacities in elite Greco-Roman wrestlers using standardized ergometric protocols. Three elite male Greco-Roman wrestlers (heavyweight division, body mass 99–100 kg) competing at the national and international level underwent physiological testing. Aerobic capacity was assessed via a graded exercise test on a treadmill ergometer with continuous breath-by-breath gas exchange analysis. Anaerobic performance was evaluated using a 30-second Wingate anaerobic test. Maximal oxygen uptake (VO₂max) ranged from 46 to 63 ml/min/kg. Notably, one athlete exhibited a VO₂max of 63 ml/min/kg, a value more characteristic of endurance-trained athletes than heavyweight combat sport competitors. The findings demonstrate considerable inter-individual variability in both aerobic and anaerobic capacities among elite heavyweight Greco-Roman wrestlers. Training zone recommendations based on individualized physiological profiling are presented.`,
  },
  {
    titlePrefix: "Genetic Markers for Talent",
    abstract: `The emergence of molecular biology tools in sport has ushered in an era of precision athlete management, in which genetic profiling, biomarker monitoring, and pharmacogenomic individualization promise to transform talent identification, training periodization, and injury prevention. This applied review synthesizes findings from a multi-year national sports science research program (2006–2009) involving 127 elite athletes from Greco-Roman wrestling, canoe/kayak sprint, rowing, and weightlifting. The program employed real-time polymerase chain reaction (qPCR) to genotype athletes for polymorphisms in ACE, AGT, ACTN3, AMPD1, MYH7, VDR, COL1A1, and CALCR genes. Mutations in AGT, AGT2R1, ACTN3, and AMPD1 were significantly associated with physical performance phenotypes. The integration of genetic, immunological, pharmacogenomic, and biomarker data within a single national program demonstrates the feasibility and potential of precision sport science.`,
  },
  {
    titlePrefix: "Longitudinal Physiological Monitoring",
    abstract: `This longitudinal case study examined the efficacy of systematic physiological monitoring in guiding individualized training periodization for junior cross-country skiers across three consecutive competitive seasons. Six male junior cross-country skiers from a regional sports academy underwent quarterly laboratory testing including determination of anaerobic threshold, maximal alactic muscular power, stroke volume estimation, and daily heart rate variability monitoring. Over three seasons, mean AnT power increased 16.9%, MAM increased 30.8%, and estimated VO₂max improved 14.8%. HRV monitoring enabled early detection of functional overreaching in two athletes, prompting training modifications that prevented progression to non-functional overreaching. Systematic physiological monitoring integrated into a coaching feedback loop can guide effective individualized training periodization in developing endurance athletes.`,
  },
  {
    titlePrefix: "Leveraging Artificial Intelligence",
    abstract: `As subscription-based MarTech companies grew beyond what manual account management could handle, many turned to AI as a practical response to a staffing problem. This systematic review synthesizes findings from 142 peer-reviewed studies published between 2020 and 2025, examining how mobile attribution and marketing technology companies have adopted AI within their customer success operations. We propose a novel strategic framework — the AI-Driven Customer Success Maturity Model (AICSMM) — that maps five progressive stages of AI integration: Reactive Support, Data-Informed Engagement, Predictive Intelligence, Autonomous Optimization, and Cognitive Partnership. The NRR gains were the most consistent finding, ranging from 34% to 47% improvement, alongside a 2.8× acceleration in mid-market to enterprise client migration. Attribution platforms have an edge here that other SaaS verticals lack: they already sit on the behavioral data that health-scoring models need. Models trained on attribution-specific telemetry hit 89%+ accuracy, outperforming generic engagement-based scores by a wide margin.`,
  },
];

async function main() {
  for (const u of updates) {
    const rows = await db
      .select({ id: submissions.id, title: submissions.title })
      .from(submissions)
      .where(like(submissions.title, `${u.titlePrefix}%`));

    for (const row of rows) {
      await db.update(submissions).set({ abstract: u.abstract }).where(eq(submissions.id, row.id));
      console.log(`✓ Updated: ${row.title.slice(0, 60)}...`);
    }
  }
  console.log("Done!");
}

main().catch(console.error);
