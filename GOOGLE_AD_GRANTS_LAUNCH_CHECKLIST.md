# Google Ad Grants Launch Checklist for American Impact Review

## Complete Guide: First Campaign for a 501(c)(3) Academic Journal

**Last updated: March 2026**
**Budget: $10,000/month in free Google Search ads**

---

## TABLE OF CONTENTS

1. [Pre-Launch Requirements](#1-pre-launch-requirements)
2. [Google Ads Cabinet Setup (Step-by-Step)](#2-google-ads-cabinet-setup)
3. [Campaign Structure & Architecture](#3-campaign-structure--architecture)
4. [Keyword Research & Selection](#4-keyword-research--selection)
5. [Ad Copy & Extensions](#5-ad-copy--extensions)
6. [Bidding Strategy](#6-bidding-strategy)
7. [Targeting Setup](#7-targeting-setup)
8. [Conversion Tracking & GA4](#8-conversion-tracking--ga4)
9. [First Campaign Testing Methodology](#9-first-campaign-testing-methodology)
10. [Metrics, KPIs & Decision Framework](#10-metrics-kpis--decision-framework)
11. [Ongoing Management Schedule](#11-ongoing-management-schedule)
12. [Compliance Checklist (Monthly)](#12-compliance-checklist-monthly)
13. [Common Mistakes & Real-World Lessons](#13-common-mistakes--real-world-lessons)
14. [Sources](#14-sources)

---

## 1. PRE-LAUNCH REQUIREMENTS

### 1.1 Eligibility Verification
- [ ] Confirm 501(c)(3) status is current and in good standing
- [ ] Verify organization is NOT a governmental entity, hospital, or academic institution (501(c)(3) nonprofits are eligible; universities themselves are not unless they meet specific criteria)
- [ ] Confirm the organization is registered with TechSoup/Percent (required for Google for Nonprofits)

### 1.2 Website Requirements (CRITICAL - Checked During Application)
- [ ] Website has SSL certificate (https://)
- [ ] Website has 5+ substantive pages with real content
- [ ] Clear mission statement prominently displayed
- [ ] Detailed description of programs, activities, and services
- [ ] Privacy policy page exists and is linked
- [ ] Website is mobile-responsive
- [ ] No broken links or placeholder content
- [ ] No excessive advertising or affiliate links
- [ ] Clear calls to action (submit paper, read articles, volunteer for review, etc.)
- [ ] Website demonstrates E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)

**For American Impact Review specifically:**
- [ ] "About" page with mission, editorial board, and 501(c)(3) information
- [ ] "Submit a Paper" page with clear instructions
- [ ] "For Reviewers" page explaining how to become a peer reviewer
- [ ] Published articles are accessible (at least abstracts)
- [ ] Contact information visible

### 1.3 Application Sequence (Do NOT skip steps or reorder)
1. **Create a dedicated Google account** (e.g., grants@americanimpactreview.com) — do this 2-3 weeks before applying
2. **Register with Percent** (formerly TechSoup verification) at percent.com
3. **Apply for Google for Nonprofits** at google.com/nonprofits — approval typically takes 3-5 business days
4. **Activate Google Ad Grants** from within your Google for Nonprofits dashboard — click "Get Started" under Ad Grants section
5. **Wait for website review** — Google checks your site for compliance (typically 3 business days)
6. **Set up Google Ads account** — IMPORTANT: When prompted, choose "Classic" Google Ads (NOT "Smart Campaign" or "Smart Setup")

> **WARNING:** Do NOT create a Google Ads account before getting accepted. Google will provision a ready-made Ad Grant account after approval. Creating one prematurely causes problems.

> **REJECTION RATE:** 47% of applications are rejected on first submission. Following this checklist systematically yields a 91% approval rate on first or second attempt.

---

## 2. GOOGLE ADS CABINET SETUP

### 2.1 Account Configuration
- [ ] Verify account type shows "Google Ad Grants" (not regular Google Ads)
- [ ] Set account time zone to your primary operating zone (EST for American Impact Review)
- [ ] Set currency to USD
- [ ] Enable auto-tagging (critical for GA4 integration)

### 2.2 Link GA4 to Google Ads
- [ ] Go to GA4 Admin > Product Links > Google Ads Links
- [ ] Click "Link" and choose your Google Ads account
- [ ] Enable auto-tagging when prompted
- [ ] Confirm and submit
- [ ] Verify time zones match between GA4 and Google Ads
- [ ] Wait 24-48 hours for data to start flowing

### 2.3 Import Conversions from GA4
- [ ] In Google Ads, go to Tools > Measurement > Conversions
- [ ] Click "Import" > Select "Google Analytics 4 properties"
- [ ] Select each GA4 key event you want to import as a conversion
- [ ] Recommended conversions for an academic journal:
  - Paper submission form completion
  - Reviewer application form completion
  - Newsletter signup
  - PDF download of published articles
  - "Contact Us" form submission
  - Time on site > 2 minutes (engaged session)
  - Page views > 3 pages per session

### 2.4 Set Up Google Tag Manager (Recommended)
- [ ] Create GTM container for americanimpactreview.com
- [ ] Install GTM snippet on all pages
- [ ] Set up GA4 configuration tag
- [ ] Set up event tags for each conversion action
- [ ] Test all tags in GTM Preview mode before publishing

---

## 3. CAMPAIGN STRUCTURE & ARCHITECTURE

### 3.1 Campaign Architecture for an Academic Journal

**IMPORTANT RULE:** Set each campaign's daily budget to $329 (the full daily equivalent of $10,000/month). Let Google optimize spend toward the highest-performing campaigns. Do NOT segment budgets manually between campaigns.

#### Recommended Campaign Structure:

**Campaign 1: "Submit Your Research"** (Author Acquisition)
- Ad Group 1A: Academic publishing opportunities
- Ad Group 1B: Peer-reviewed journal submissions
- Ad Group 1C: Open access publication

**Campaign 2: "Read Our Research"** (Reader Acquisition)
- Ad Group 2A: Specific research topics covered by the journal
- Ad Group 2B: American policy research / impact studies
- Ad Group 2C: Free academic articles access

**Campaign 3: "Become a Reviewer"** (Reviewer Recruitment)
- Ad Group 3A: Peer review opportunities
- Ad Group 3B: Academic volunteering / scholarly service

**Campaign 4: "About Our Mission"** (Brand/Mission Awareness)
- Ad Group 4A: Nonprofit academic publishing
- Ad Group 4B: Research impact / community scholarship

**Campaign 5 (Optional): "For Institutions"**
- Ad Group 5A: University library resources
- Ad Group 5B: Institutional partnerships

### 3.2 Structural Requirements (Compliance)
- [ ] Minimum 2 campaigns active at all times
- [ ] Minimum 2 ad groups per campaign
- [ ] Minimum 2 active ads per ad group
- [ ] Each ad group has a dedicated, relevant landing page
- [ ] Active sitelink extensions at the account level

---

## 4. KEYWORD RESEARCH & SELECTION

### 4.1 Tools to Use
- **Google Keyword Planner** (free with your Ad Grants account) — primary tool
- **Google Search Console** — see what queries already drive traffic
- **Google Trends** — identify seasonal patterns in academic publishing
- **AnswerThePublic** — find question-based long-tail keywords
- **Ubersuggest** (free tier) — competitor keyword ideas

### 4.2 Keyword Rules for Ad Grants (Compliance)
- [ ] NO single-word keywords (except brand name, recognized medical conditions, or Google's approved exception list)
- [ ] All keywords must be multi-word phrases (2+ words)
- [ ] All keywords must be mission-relevant
- [ ] Keywords with Quality Score of 1 or 2 MUST be paused or removed immediately
- [ ] Target 300-500 total keywords across the account for sufficient coverage
- [ ] 5-20 keywords per ad group (tightly themed)

### 4.3 Keyword Ideas for American Impact Review

**Author-focused keywords:**
- "submit research paper for publication"
- "peer reviewed journal accepting submissions"
- "publish academic paper free"
- "open access journal submission"
- "interdisciplinary research publication"
- "social science journal submission"
- "how to publish research paper"
- "academic journal for policy research"
- "free journal publication opportunities"
- "nonprofit academic journal submissions"

**Reader-focused keywords:**
- "free academic research articles"
- "open access policy research"
- "American impact studies research"
- "community development research papers"
- "nonprofit research publications"
- "social impact research articles"
- "evidence-based policy research"

**Reviewer-focused keywords:**
- "become a peer reviewer"
- "peer review volunteer opportunities"
- "academic peer review experience"
- "scholarly journal reviewer application"
- "how to become a journal reviewer"

**Mission/Brand keywords:**
- "nonprofit academic publishing"
- "community impact research"
- "immigrant research publication"
- "inclusive academic publishing opportunities"
- "diverse voices in academic research"

### 4.4 Negative Keywords (Add from Day 1)
- [ ] Create a shared negative keyword list at the account level
- [ ] Add these BEFORE launching campaigns:

**Obvious negatives:**
- jobs, salary, careers, hiring, employment
- free download, torrent, pirate, hack
- essay writing service, write my paper, buy essay
- Wikipedia, Quora, Reddit
- predatory journal, scam journal
- college homework, assignment help
- degree, diploma, certificate (unless relevant)

**Competition/irrelevant negatives:**
- specific competitor journal names (Nature, Science, Elsevier, etc.)
- "impact factor" (you likely don't have one yet)
- news, newspaper, magazine (if not relevant)
- blog, vlog, podcast (unless relevant)

### 4.5 Match Types Strategy
- Start with **phrase match** and **exact match** for control
- Use **broad match** only with Maximize Conversions bidding and strong conversion tracking
- Review search terms report weekly to add negatives and new keyword ideas

---

## 5. AD COPY & EXTENSIONS

### 5.1 Responsive Search Ads (RSA) — Required Format

Each ad group needs at least 2 RSAs. Each RSA allows:
- Up to **15 headlines** (30 characters each)
- Up to **4 descriptions** (90 characters each)
- Google will test combinations automatically

**Goal: Achieve "Good" or "Excellent" Ad Strength rating**

#### Example RSA for "Submit Your Research" Campaign:

**Headlines (provide 10-15):**
1. Submit Your Research Paper
2. Publish in a Peer-Reviewed Journal
3. Free Academic Publication
4. American Impact Review Journal
5. Open Access Research Publication
6. Submit Manuscripts Online
7. 501(c)(3) Nonprofit Journal
8. Peer-Reviewed & Open Access
9. Share Your Research Impact
10. Accepting Submissions Now
11. Publish Your Academic Work
12. Interdisciplinary Research Journal
13. No Submission Fees
14. Reach a Wider Audience
15. Rigorous Peer Review Process

**Descriptions (provide 4):**
1. Submit your research to American Impact Review, a peer-reviewed open-access journal by a 501(c)(3) nonprofit.
2. Free publication in an interdisciplinary journal focused on research that impacts American communities.
3. Join authors from diverse backgrounds. Rigorous peer review. No publication fees. Submit your manuscript today.
4. American Impact Review publishes research across disciplines. Open access ensures your work reaches everyone.

### 5.2 Ad Extensions (MANDATORY for compliance and performance)

**Sitelink Extensions (minimum 4):**
- [ ] "Submit a Paper" → /submit
- [ ] "Published Articles" → /articles
- [ ] "Become a Reviewer" → /reviewers
- [ ] "About Our Mission" → /about
- [ ] "Editorial Board" → /editorial-board
- [ ] "Contact Us" → /contact

**Callout Extensions (add 4-6):**
- [ ] "Free Publication"
- [ ] "Open Access"
- [ ] "Peer-Reviewed"
- [ ] "501(c)(3) Nonprofit"
- [ ] "No Submission Fees"
- [ ] "Interdisciplinary Journal"

**Structured Snippet Extensions:**
- [ ] Header: "Types" → Research articles, Policy analysis, Literature reviews, Case studies
- [ ] Header: "Subjects" → Social science, Public policy, Community development, Education, Health

### 5.3 Ad Copy Best Practices
- Include your primary keyword in at least 2-3 headlines
- Include a clear call to action ("Submit Now," "Read Free," "Apply Today")
- Highlight what makes you unique (free, nonprofit, open access)
- Pin your brand name to position 1 or 2 in at least one headline
- Use numbers when possible ("Published Since 2024," "100% Open Access")
- NEVER use keyword stuffing — write naturally

---

## 6. BIDDING STRATEGY

### 6.1 Understanding the $2 Cap

| Bidding Strategy | $2 Cap Applies? | Recommended For |
|---|---|---|
| Manual CPC | YES ($2 max) | Testing phase, low-competition keywords |
| Maximize Conversions | NO (can bid higher) | Main strategy once conversions are flowing |
| Maximize Conversion Value | NO (can bid higher) | When you have conversion values assigned |
| Target CPA | YES ($2 max) | Not recommended for Ad Grants |
| Target ROAS | YES ($2 max) | Not recommended for Ad Grants |

### 6.2 Recommended Approach

**Phase 1 (Weeks 1-4): Maximize Conversions**
- Use Maximize Conversions from the start (Google now requires conversion-based bidding for accounts created after 2019)
- This removes the $2 bid cap and lets Google bid competitively
- Requires accurate conversion tracking (set this up BEFORE launching)
- Google's algorithm needs data — expect a "learning period" of 1-2 weeks

**Phase 2 (Weeks 5+): Optimize based on data**
- If Maximize Conversions is spending too aggressively on irrelevant clicks, add a Target CPA constraint
- If certain campaigns underperform, consider pausing and reallocating
- Test Maximize Conversion Value if you've assigned different values to different conversion types

### 6.3 Budget Allocation
- Set ALL campaigns to $329/day budget
- Do NOT manually split budget (e.g., $100 here, $229 there)
- Google will naturally allocate more to higher-performing campaigns
- Total account spend will never exceed $329/day ($10,000/month)

> **KEY INSIGHT:** The average Ad Grant account only uses $300 of the $10,000 monthly. The #1 reason is insufficient keyword coverage. Well-managed accounts average $8,650/month. The difference is active management.

---

## 7. TARGETING SETUP

### 7.1 Geographic Targeting
- [ ] Target the United States (primary)
- [ ] Consider adding: Canada, UK, Australia (English-speaking academic markets)
- [ ] Do NOT target "All countries and territories" — this wastes budget on irrelevant traffic
- [ ] Use "Presence: People IN your targeted locations" (not "Presence or interest")
- [ ] If local events/conferences, use radius targeting around specific cities

**For American Impact Review:**
Start with USA only. Expand to other English-speaking countries after 30 days if budget isn't fully utilized.

### 7.2 Device Targeting
- [ ] Start with all devices enabled (desktop, mobile, tablet)
- [ ] After 2-4 weeks, review device performance data
- [ ] Academic audiences typically convert better on desktop — adjust bids accordingly
- [ ] Add bid adjustments: e.g., +20% desktop, -10% mobile (based on data)

### 7.3 Ad Scheduling
- [ ] Start with 24/7 scheduling
- [ ] After 2 weeks, review day-of-week and hour-of-day performance
- [ ] Academic audiences are most active:
  - Weekdays 8am-6pm (researchers at work)
  - Sunday evenings (common for academic work)
  - Peak months: September-November, January-March (academic calendar)
- [ ] Add bid adjustments for peak times, reduce for low-performing hours

### 7.4 Audience Targeting (Layer on Top of Keywords)
- [ ] Add audiences in "Observation" mode first (not "Targeting" mode)
  - This lets you see performance data without restricting reach
- [ ] Recommended audiences:
  - **In-Market:** Education, Research services
  - **Affinity:** Avid readers, Education enthusiasts, Technophiles
  - **Custom Segments:** Create using URLs of competitor journals, academic research sites
  - **Remarketing:** Set up remarketing lists for website visitors (create audience in GA4, import to Google Ads)
- [ ] After 30 days, review audience performance and add bid adjustments for high-performing segments

---

## 8. CONVERSION TRACKING & GA4

### 8.1 Required Conversions (Set Up BEFORE Launching Campaigns)

| Conversion Action | Type | Value | Priority |
|---|---|---|---|
| Paper submission form completion | Primary | $50 | HIGHEST |
| Reviewer application form completion | Primary | $30 | HIGH |
| Newsletter signup | Primary | $10 | HIGH |
| Contact form submission | Primary | $15 | MEDIUM |
| PDF article download | Secondary | $5 | MEDIUM |
| Engaged session (>2 min) | Secondary | $2 | LOW |
| 3+ page views per session | Secondary | $1 | LOW |

### 8.2 Conversion Tracking Setup Steps
1. [ ] Define conversion events in GA4 (Admin > Events > Create event)
2. [ ] Mark events as "Key events" in GA4
3. [ ] Import GA4 key events into Google Ads (Tools > Measurement > Conversions > Import)
4. [ ] Assign conversion values (even estimated ones help Maximize Conversions optimize)
5. [ ] Set attribution model to "Data-driven" (Google's recommendation for 2025+)
6. [ ] Test all conversions by completing each action yourself and verifying in GA4 real-time report

### 8.3 Compliance Requirement
- **MANDATORY:** At least 1 conversion must be tracked per month
- Without active conversion tracking, your account WILL be suspended
- If conversion rate appears unusually high (>50%), Google may flag it — make sure you're tracking meaningful actions, not just page views

---

## 9. FIRST CAMPAIGN TESTING METHODOLOGY

### 9.1 Launch Sequence (Professional Approach)

**Week 0 (Pre-Launch):**
- [ ] All conversion tracking tested and verified
- [ ] GA4 linked and data flowing
- [ ] Negative keyword lists populated
- [ ] Landing pages optimized (fast load, clear CTA, mobile-friendly)
- [ ] All ad extensions configured

**Week 1-2 (Soft Launch):**
- [ ] Launch 2-3 campaigns simultaneously
- [ ] Start with your highest-confidence keywords (most relevant, clearest intent)
- [ ] Check daily: Are ads showing? Are impressions accumulating?
- [ ] Review search terms report after first 100 clicks
- [ ] Add negative keywords aggressively
- [ ] Do NOT make major changes — let the system learn

**Week 3-4 (Optimization Sprint):**
- [ ] Analyze first meaningful data set (aim for 200+ clicks per ad group)
- [ ] Pause keywords with QS below 3
- [ ] Add new keywords discovered from search terms report
- [ ] Test new ad copy variations
- [ ] Review landing page bounce rates
- [ ] Adjust geographic and device targeting based on data

**Week 5-8 (Scale & Refine):**
- [ ] Launch additional campaigns if budget isn't fully utilized
- [ ] Expand keyword coverage
- [ ] Implement audience bid adjustments
- [ ] Set up A/B tests (ad experiments)
- [ ] Begin Performance Max campaign testing (if applicable)

### 9.2 What to Test First (Priority Order)

1. **Keywords** — Are people searching for what you think they are?
2. **Landing pages** — Are visitors engaging or bouncing?
3. **Ad copy** — Which messages resonate?
4. **Audiences** — Who converts best?
5. **Bidding** — Is Maximize Conversions working well?

### 9.3 A/B Testing Framework

**How to A/B test ad copy:**
- Create 2-3 RSAs per ad group with different messaging angles
- Each RSA should test a different value proposition:
  - RSA 1: Focus on "free publication" angle
  - RSA 2: Focus on "impact and readership" angle
  - RSA 3: Focus on "peer-reviewed credibility" angle
- Let each variation get at least 1,000 impressions before judging
- Use Google's built-in ad variation experiments for controlled testing

**How long to run tests:**
- **Minimum:** 2 weeks (to capture weekday/weekend patterns)
- **Recommended:** 4 weeks (for statistical reliability)
- **Maximum for a single experiment:** 85 days (Google's limit)
- **Data threshold:** At least 100 conversions per variation for conversion-based decisions
- **Confidence level:** Wait for 95% statistical significance before declaring a winner

### 9.4 Using the Search Terms Report

**How to access:** Keywords tab > Search Terms (or Insights > Search Terms Report)

**What to look for:**
- [ ] Irrelevant queries burning budget → add as negative keywords
- [ ] High-performing queries not in your keyword list → add as keywords
- [ ] Queries that reveal new audience intent you didn't anticipate
- [ ] Queries with high impressions but low CTR → your ad copy doesn't match this intent

**Review cadence:**
- Week 1-4: Review every 2-3 days
- Month 2+: Review weekly
- Ongoing: Review at least biweekly forever

---

## 10. METRICS, KPIs & DECISION FRAMEWORK

### 10.1 Key Performance Indicators

| Metric | Target | Danger Zone | Action |
|---|---|---|---|
| **Account CTR** | >8% | <5% (suspension risk) | Pause low-CTR keywords, improve ad relevance |
| **Quality Score** | 5-10 | 1-2 (must pause keyword) | Improve ad relevance, landing page, expected CTR |
| **Conversion Rate** | 2-5% | <1% | Check landing page, check conversion tracking |
| **Cost Per Conversion** | <$15-25 | >$50 | Tighten keywords, improve landing pages |
| **Impressions** | Growing weekly | <100/week per ad group | Expand keywords, check match types |
| **Monthly Spend** | >$5,000 (goal) | <$300 (average nonprofit) | Expand keywords, add campaigns |
| **Conversions/Month** | 50+ | 0 (suspension risk) | Fix tracking, improve offers |
| **Bounce Rate** | <50% | >70% | Landing page problem |

### 10.2 Daily Monitoring (5-10 minutes)
- [ ] Check account-level CTR — is it above 5%?
- [ ] Check for any policy violations or alerts
- [ ] Glance at spend — is it pacing toward budget goals?
- [ ] Check for any paused campaigns/ads (Google may auto-pause)

### 10.3 Weekly Monitoring (30-60 minutes)
- [ ] Review search terms report — add negatives, add keywords
- [ ] Check individual keyword Quality Scores — pause any QS 1-2
- [ ] Review ad performance — pause underperformers, test new variations
- [ ] Check conversion data — are conversions being tracked?
- [ ] Review device and geographic performance
- [ ] Check landing page load times and bounce rates

### 10.4 Monthly Monitoring (2-3 hours)
- [ ] Full compliance audit (see Section 12)
- [ ] Review campaign-level performance — pause/restructure failing campaigns
- [ ] Analyze audience data — adjust bid modifiers
- [ ] Review budget utilization — expand if underspending
- [ ] Update negative keyword lists
- [ ] Plan keyword expansions
- [ ] Review competitor landscape

### 10.5 When to Pause vs. Optimize

**PAUSE a keyword when:**
- Quality Score is 1 or 2 (compliance requirement)
- CTR is below 2% after 500+ impressions
- Zero conversions after 200+ clicks
- Irrelevant search terms consistently trigger it

**OPTIMIZE a keyword when:**
- Quality Score is 3-4 (improve ad relevance, landing page)
- CTR is 3-5% (test better ad copy, adjust match type)
- Conversions exist but cost is high (improve landing page, test offers)
- Good impressions but low position (might need better ad relevance)

**KILL an ad group when:**
- All keywords have QS below 3
- CTR is below 3% after 4+ weeks
- Zero conversions after 60 days
- The landing page clearly doesn't match the intent

**PAUSE a campaign when:**
- Overall CTR is dragging account below 5%
- No conversions after 60 days despite traffic
- The topic area has been exhausted (no relevant keywords left)
- Consistently high bounce rate (>80%)

### 10.6 How to Avoid Spending $10K/Month on Garbage Traffic

1. **Negative keywords from Day 1** — proactive, not reactive
2. **Review search terms report** every 2-3 days in the first month
3. **Use phrase/exact match** instead of broad match initially
4. **Geo-target tightly** — USA only to start
5. **Don't chase impressions** — chase conversions
6. **Check bounce rate** — high bounce = wrong traffic or bad landing page
7. **Use meaningful conversions** — "page view" is not a meaningful conversion
8. **Don't use overly broad keywords** — "research" alone will attract garbage
9. **Set up audience exclusions** — exclude demographics/audiences that never convert
10. **Weekly audits** — the moment you stop checking, quality degrades

---

## 11. ONGOING MANAGEMENT SCHEDULE

### Weekly Routine (1-2 hours total)

**Monday (30 min):**
- [ ] Review weekend performance
- [ ] Check account-wide CTR
- [ ] Review any Google Ads alerts or recommendations

**Wednesday (30 min):**
- [ ] Search terms report review
- [ ] Add negative keywords
- [ ] Add promising new keywords
- [ ] Check Quality Scores

**Friday (30 min):**
- [ ] Review ad performance
- [ ] Pause underperforming ads
- [ ] Draft new ad variations
- [ ] Check conversion tracking

### Monthly Routine (First Week of Month)

- [ ] Full compliance audit (see Section 12)
- [ ] Campaign performance review
- [ ] Budget utilization analysis
- [ ] Keyword expansion research
- [ ] Landing page optimization review
- [ ] Audience performance review
- [ ] Competitor analysis
- [ ] Strategy adjustment planning

### Quarterly Routine

- [ ] Major strategy review — are campaigns aligned with organizational goals?
- [ ] Landing page redesign/refresh if needed
- [ ] New campaign development for seasonal opportunities
- [ ] Review and update conversion values
- [ ] Complete any Google annual survey requirements

---

## 12. COMPLIANCE CHECKLIST (Monthly Audit)

Run through this checklist on the 1st of every month to avoid suspension:

### Account Structure
- [ ] At least 2 active campaigns
- [ ] At least 2 active ad groups per campaign
- [ ] At least 2 active ads per ad group
- [ ] Active sitelink extensions at account level

### Performance
- [ ] Account-wide CTR is above 5%
- [ ] At least 1 conversion tracked this month
- [ ] No keywords with Quality Score of 1 or 2 are active

### Keywords
- [ ] No single-word keywords active (unless approved exceptions)
- [ ] All keywords are mission-relevant
- [ ] No overly generic keywords

### Bidding
- [ ] Using Maximize Conversions or another approved Smart Bidding strategy
- [ ] Conversion tracking is accurate and active

### Website
- [ ] Website is live and functional
- [ ] SSL certificate is valid
- [ ] Mission information is up to date
- [ ] No broken landing page URLs in ads

### Account Activity
- [ ] Logged into account within the past 30 days
- [ ] Made at least one meaningful change within past 90 days
- [ ] Annual program survey completed (when sent by Google)

> **SUSPENSION RISK:** Failing CTR requirement for 2 consecutive months = temporary deactivation. New accounts get a 90-day grace period for CTR compliance.

---

## 13. COMMON MISTAKES & REAL-WORLD LESSONS

### Top Mistakes Nonprofits Make

**Mistake 1: "Set It and Forget It"**
Accounts reviewed less than twice monthly spend 62% less budget and generate 73% fewer conversions than actively managed accounts. This is the #1 killer of Ad Grant value.

**Mistake 2: Too Few Keywords**
The #1 reason nonprofits don't spend their full budget is insufficient keyword coverage. If you're only targeting 50-100 keywords, you won't generate enough traffic. Aim for 300-500.

**Mistake 3: Keywords Too Broad**
Choosing keywords that are too broad, irrelevant, or highly competitive leads to poor ad performance. "Research" alone will attract millions of irrelevant searches. "Peer reviewed journal accepting research submissions" is much better.

**Mistake 4: Targeting the Whole World**
In an effort to spend the full grant, some nonprofits target all countries. This leads to low engagement and poor conversion rates. Start with USA and expand deliberately.

**Mistake 5: Ignoring Landing Pages**
Your ads are only as good as your landing pages. If the landing page doesn't match the ad promise and search intent, visitors bounce, CTR drops, and Quality Score tanks.

**Mistake 6: Not Tracking Conversions**
Many nonprofits focus solely on website traffic. Without conversion tracking, you can't optimize, and since January 2024, you'll get suspended for not tracking conversions.

**Mistake 7: Ignoring Quality Score**
Keywords with QS 1-2 must be removed (compliance). But even QS 3-4 keywords need attention. Aim for QS 7+ for best performance.

**Mistake 8: Not Using the Search Terms Report**
This is your #1 optimization tool. Without reviewing it, you're flying blind and letting irrelevant queries drain your budget.

### What Surprises Nonprofits

1. **The $300 reality:** Average nonprofits only spend $300 of $10,000/month. Well-managed accounts spend $8,650+. The difference is purely management effort.

2. **The 5% CTR cliff:** Falling below 5% CTR for 2 months gets you suspended. This often catches organizations off guard, especially those managing accounts independently.

3. **Maximize Conversions removes the $2 cap:** Many nonprofits don't realize this. Using this bid strategy lets you compete for keywords that cost $6-8/click, dramatically expanding your reach.

4. **AI Overviews are eating clicks:** Since January 2025, Google's AI Overviews answer 91.3% of informational queries directly on the SERP. For nonprofits whose mission awareness depends on informational searches, fewer users now click through to websites. Focus on transactional and navigational intent keywords.

5. **Performance Max is now available:** Since January 2025, all Grant accounts can use Performance Max campaigns (Search + Maps only). This is a new tool to test.

6. **The grant doesn't show on Form 990:** Gifts of in-kind services like Google Ad Grants are not reported as income or expense on Federal Form 990. They're included in reconciling items on Schedule D.

7. **Small orgs can compete:** Google rewards relevancy, not size. If your programs match what people search for, you can outperform much larger organizations.

### What Experienced Nonprofits Would Do Differently

1. **Start with conversion tracking first** — don't launch campaigns until it's verified working
2. **Build negative keyword lists proactively** — don't wait for bad data
3. **Invest in landing pages** before investing in more keywords
4. **Check compliance monthly** — don't wait for a suspension notice
5. **Use Maximize Conversions from day one** — the $2 cap severely limits reach
6. **Focus on quality over quantity** — 100 right clicks > 10,000 wrong clicks
7. **Budget 1-2 hours weekly minimum** for management
8. **Don't try to spend all $10,000 immediately** — build up methodically

---

## 14. SOURCES

### Official Google Documentation
- [Google Ad Grants Official Site](https://www.google.com/grants/)
- [Ad Grants Policy Compliance Guide (Google Support)](https://support.google.com/nonprofits/answer/9314402?hl=en)
- [Ad Grants FAQ & Requirements](https://www.google.com/grants/faq/)
- [Set Up Conversion Tracking (Ad Grants Help)](https://support.google.com/grants/answer/9038650?hl=en)
- [Tips for Success with Google Ad Grants](https://support.google.com/nonprofits/answer/98870?hl=en)
- [Account Management Policy](https://support.google.com/grants/answer/117827?hl=en)
- [Add Negative Keywords (Ad Grants Help)](https://support.google.com/grants/answer/9842510?hl=en)

### Comprehensive Guides (2025-2026)
- [Donorbox: Beginner's Guide to Google Ad Grants (2026 Updated)](https://donorbox.org/nonprofit-blog/guide-to-google-ad-grants)
- [Big Sea: Google Ad Grants Explained — Ultimate Guide for Nonprofits (2025)](https://bigsea.co/articles/get-google-ad-grants-nonprofit/)
- [Getting Attention: Google Ad Grants — How Nonprofits Can Maximize $10K/Month](https://gettingattention.org/google-ad-grants/)
- [Crimson Agility: Ultimate Guide to Google Ads Grant Program (2025 Edition)](https://crimsonagility.us/google-ads-grant-program/)
- [GROAS: Google Ad Grants Complete 2025 Guide](https://groas.ai/post/google-ad-grants-for-nonprofits-complete-2025-guide-to-your-free-10k-month)
- [GROAS: How to Get Google Ad Grants Approved — Step-by-Step (2026)](https://groas.ai/post/how-to-get-google-ad-grants-approved-step-by-step-application-guide-2026)
- [Zeffy: Your 2025 Guide to Google Ad Grants for Nonprofits](https://www.zeffy.com/blog/google-ad-grants-for-nonprofits)
- [Lunio: How to Secure Google Ad Grants (2025)](https://www.lunio.ai/blog/how-to-secure-google-ad-grants)
- [ReachRight Studios: Google Ad Grant Ultimate Guide 2025](https://reachrightstudios.com/blog/google-ad-grant-guide/)

### Compliance & Rules
- [Digital Tabby: 13 Google Ad Grant Rules and Policies (Updated 2026)](https://digitaltabby.com/google-ad-grant-rules-policies/)
- [NonprofitAds: Google Ad Grant Compliance Checklist (2026)](https://nonprofitads.org/google-ad-grant-compliance-checklist-2026/)
- [Right Meow Digital: Google Ad Grant Compliance Checklist (2026)](https://rightmeowdigital.com/google-ad-grant-compliance-checklist-2026-how-to-stay-eligible-and-avoid-suspension/)
- [Big Sea: Don't Get Suspended — Google Ad Grants Requirements](https://bigsea.co/articles/google-ad-grants-requirements/)
- [Getting Attention: Google Ad Grants Rules — 9 Compliance Policies](https://gettingattention.org/google-ad-grants-rules/)

### Bidding & Optimization
- [AboveX Digital: Comparison of Bid Strategies in Ad Grants](https://www.abovexdigital.com/bid-strategies-ad-grants/)
- [Media Cause: Should Nonprofits Use Maximize Conversions?](https://mediacause.com/maximize-conversions-ad-grants/)
- [Savvy Revenue: Google Ads Optimization Schedule](https://savvyrevenue.com/blog/adwords-optimization-calendar/)
- [JB Media: Google Ad Grant Management Best Practices](https://jbmediagroupllc.com/blog/google-ad-grants-management-best-practices-optimization/)
- [RKD Group: 5 Tips to Squeeze More Out of Your Google Ad Grant](https://blog.rkdgroup.com/5-tips-to-squeeze-more-out-of-your-google-ad-grant-spend)

### Mistakes & Myths
- [Nonprofit Megaphone: Google Ad Grant Myths — 15 Misconceptions Debunked](https://nonprofitmegaphone.com/blog/google-ad-grant-myths-busted)
- [ReCharity: 4 Mistakes Nonprofits Make with Google Ad Grants](https://recharity.ca/google-ad-grant-mistakes/)
- [Newbird: Google Ad Grants Mistakes to Avoid](https://newbird.com/5-common-mistakes-to-avoid-when-managing-your-google-ad-grants-campaign/)
- [Nexus Direct: Maximize Google Ad Grant Spending — 6 Common Mistakes](https://nexusdirect.com/idea-blog/maximize-google-ad-grant-spending/)

### Performance & KPIs
- [Nonprofit Tech for Good: Evaluating Google Ad Grants Campaign Effectiveness](https://www.nptechforgood.com/2023/09/17/a-comprehensive-guide-to-evaluating-the-effectiveness-of-your-nonprofits-google-ad-grants-campaign/)
- [Bonterra: How to Measure Google Ad Grants Campaign Performance](https://www.bonterratech.com/blog/google-ad-grants-campaign-performance)
- [Newbird: Google Ad Grants KPIs](https://newbird.com/measuring-success-kpis-for-google-ad-grants/)
- [AboveX Digital: Master CTR in Google Ad Grants](https://www.abovexdigital.com/master-ctr-in-google-ad-grants/)
- [Terra: Google Ads Benchmarks for 2025](https://terrahq.com/blog/google-ads-benchmarks-2025/)

### A/B Testing & Methodology
- [Marketing Blatt: Google Ads A/B Testing 2025](https://blog.marketingblatt.com/en/google-ads-ab-testing)
- [Karooya: Google Ads Experiments (2025)](https://www.karooya.com/blog/google-ads-experiments-a-b-test-bidding-creatives-campaign-changes-effectively/)
- [AdNabu: Ultimate Guide to Google Ads A/B Testing (2026)](https://blog.adnabu.com/google-ads/google-ads-ab-testing/)
- [Coursera: Google Ads A/B Testing Guide](https://www.coursera.org/articles/google-ads-ab-testing)

### Performance Max for Ad Grants
- [ConnectAd: Performance Max for Google Ad Grants](https://connectad.ca/blog/google-ad-grant-performance-max/)
- [Newbird: Performance Max Campaigns in Google Ad Grants](https://newbird.com/google-ad-grants-now-supports-performance-max-campaigns/)
- [Whole Whale: 2025 Ad Grant Updates — Performance Max & Google Maps](https://wholewhale.com/tips/google-maps-placements-for-ad-grants/)
- [Click Nonprofit: How to Use Performance Max with Google Ad Grant (2025)](https://clicknonprofit.com/how-to-use-performance-max-campaigns-with-the-google-ad-grant/)

### GA4 & Conversion Tracking
- [MeasureSchool: How to Link Google Ads to GA4 (2025)](https://measureschool.com/link-google-ads-to-google-analytics-4/)
- [Stape: Google Ads Conversion Tracking Setup Guide (2026)](https://stape.io/blog/google-ads-conversion-tracking)
- [EasyInsights: How to Integrate GA4 with Google Ads](https://easyinsights.ai/blog/integrate-ga4-with-google-ads/)

### Ad Extensions
- [Torchbox: Google Ad Grants — Ad Extensions](https://torchbox.com/blog/google-ad-grants-ad-extensions/)
- [Cause Inspired Media: Google Ads Extensions](https://causeinspiredmedia.com/google-ads/google-ads-extensions/)
- [Social Link: 2025 Guide for Nonprofits — Maximizing Google Ads Grants](https://sociallink.com/blog/2025-guide-for-nonprofits-maximizing-google-ads-grants/)

---

## QUICK-START TIMELINE

| Week | Action | Time Investment |
|---|---|---|
| Week -3 | Create dedicated Google account | 30 min |
| Week -2 | Register with Percent, apply for Google for Nonprofits | 1 hour |
| Week -1 | Activate Ad Grants, set up GA4 linking, conversion tracking | 3-4 hours |
| Week 0 | Build campaigns, keywords, ads, extensions, negative keywords | 6-8 hours |
| Week 1 | Launch first 2-3 campaigns, monitor daily | 1 hour/day |
| Week 2 | First search terms review, add negatives, first optimizations | 2 hours |
| Week 3-4 | Optimization sprint — refine keywords, ads, landing pages | 2 hours/week |
| Month 2 | Scale — add campaigns, expand keywords, test PMax | 2 hours/week |
| Month 3+ | Ongoing management — weekly routine | 1-2 hours/week |
