"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Heart,
  Users,
  Target,
  Edit,
  ShieldCheck,
  MessageSquare,
  Trophy,
  BarChart3,
  Globe,
  AlertTriangle,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CampaignSponsorWall } from "@/components/modules/campaign/sponsor-wall/CampaignSponsorWall";
import { CampaignCollaboration } from "@/components/modules/campaign/collaboration/CampaignCollaboration";
import { CampaignMilestones } from "@/components/modules/campaign/CampaignMilestones";
import { CampaignQAModeration } from "@/components/modules/campaign/qa/CampaignQAModeration";
import { CampaignSeries } from "@/components/modules/campaign/series/CampaignSeries";
import { CampaignAnalyticsDashboard } from "@/components/modules/campaign/analytics/CampaignAnalyticsDashboard";
import { BackerCommunity } from "@/components/modules/campaign/community/BackerCommunity";
import { TopBackers } from "@/components/modules/campaign/backers/TopBackers";
import { TOP_BACKERS_LIMIT } from "@/types/campaign-backers";
import { CampaignFundingVelocityChart } from "@/components/modules/campaign/FundingVelocityChart";

const translations = {
  es: {
    title: "Agua Limpia para la Cuenca del Turkana",
    shortDescription: "Perforando y manteniendo pozos para 12 comunidades rurales mediante gestión comunitaria y streaming de pagos transparente.",
    fullStory: "El proyecto Agua Limpia para la Cuenca del Turkana capacita a técnicos de agua locales para monitorear, mantener y reparar pozos comunitarios. Los fondos recaudados se bloquean en flujos de pago transparentes en Stellar para operaciones de perforación, pruebas de calidad del agua y comités de puntos de agua.",
    impactStatement: "Brindar acceso a agua potable a más de 5,000 residentes mientras se reduce a la mitad la incidencia de enfermedades transmitidas por el agua en la cuenca.",
  },
  pt: {
    title: "Água Limpa para a Bacia de Turkana",
    shortDescription: "Perfurando e mantendo poços para 12 comunidades rurais por meio de gestão comunitária e streaming de pagamentos transparente.",
    fullStory: "O projeto Água Limpa para a Bacia de Turkana capacita técnicos de água locais a monitorar, manter e reparar poços comunitários. Os fundos arrecadados são bloqueados em fluxos de pagamento transparentes na Stellar para operações de perfuração, testes de qualidade da água e comitês de pontos de água.",
    impactStatement: "Garantir acesso à água potável para mais de 5.000 moradores enquanto reduz à metade a incidência de doenças transmitidas pela água na bacia.",
  },
  fr: {
    title: "Eau Potable pour le Bassin du Turkana",
    shortDescription: "Forage et entretien de puits pour 12 communautés rurales grâce à une gestion communautaire et un streaming de paiements transparent.",
    fullStory: "Le projet Eau Potable pour le Bassin du Turkana permet à des techniciens de l'eau locaux de surveiller, entretenir et réparer les puits communautaires. Les fonds collectés sont verrouillés dans des flux de paiement transparents sur Stellar pour les opérations de forage, les tests de qualité de l'eau et les comités de points d'eau.",
    impactStatement: "Fournir un accès à l'eau potable à plus de 5 000 habitants tout en réduisant de moitié l'incidence des maladies hydriques dans le bassin.",
  },
} as const;

const languageNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  de: "German",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  ar: "Arabic",
  ru: "Russian",
};

type TranslationKey = keyof typeof translations;

const detectLanguage = (text: string): string => {
  if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)) return "zh";
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[\u0600-\u06ff]/.test(text)) return "ar";
  if (/[\u0400-\u04ff]/.test(text)) return "ru";
  return "en";
};

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("overview");
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  // Mock campaign record data
  const campaign = {
    id: id || "camp-101",
    title: "Clean Water for the Turkana Basin",
    category: "Clean Water & Sanitation",
    creator: "GD6W...X892",
    shortDescription: "Drilling and maintaining boreholes for 12 rural communities through community-led stewardship and transparent payment streaming.",
    fullStory: "The Clean Water for the Turkana Basin project trains local water technicians to monitor, maintain, and repair community boreholes. Funds raised are locked in transparent Stellar payment streams for drilling operations, water-quality testing, and water-point committee stipends.",
    goalAmount: "50,000",
    raisedAmount: "33,850",
    token: "XLM",
    status: "ACTIVE",
    startDate: "2026-08-01",
    endDate: "2026-10-31",
    impactStatement: "Provide reliable clean water access to 5,000+ residents while cutting waterborne illness in half across the basin.",
    beneficiaries: "5,000 residents of the Turkana Basin",
    litersPerYear: "2,400,000",
    successStory: {
      headline: "From Pledge to Flowing Water",
      creatorInterview: "Every XLM stream is tied to a verified borehole's GPS coordinates and water-quality test results, and backers receive monthly flow-rate updates. The team shipped on every promise.",
      backerTestimonials: [
        { name: "Marta L.", location: "Lisbon, Portugal", quote: "I could see exactly where my contribution went." },
        { name: "Devon K.", location: "Austin, TX", quote: "You can tell this is a team that ships." },
        { name: "Priya N.", location: "Bengaluru, India", quote: "More campaigns should publish stories like this." },
      ],
    },
  };

  // The mock detail page renders as the campaign creator, so creator-only
  // controls (featuring backers, managing community spaces) are exercised.
  // Replace with the connected wallet address once wallet state is wired here.
  const viewerAddress = campaign.creator;
  const isCreatorView = viewerAddress === campaign.creator;

  const detectedLang = detectLanguage(campaign.title + campaign.shortDescription + campaign.fullStory);
  const detectedLanguageName = languageNames[detectedLang] ?? detectedLang;
  const [translationLang, setTranslationLang] = useState<TranslationKey | "">("");
  const translation = translationLang ? translations[translationLang] : null;

  const progressPct = Math.min(
    100,
    Math.round(
      (parseFloat(campaign.raisedAmount.replace(/,/g, "")) /
        parseFloat(campaign.goalAmount.replace(/,/g, ""))) *
        100
    )
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Navigation Top */}
      <div className="flex items-center justify-between">
        <Link
          href="/campaigns"
          className="inline-flex items-center text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Campaigns Directory
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/campaigns/create">
            <Button size="sm" variant="outline" className="border-purple-600/40 text-purple-300 hover:bg-purple-950/40 text-xs">
              <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit Campaign
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-600/40 text-amber-300 hover:bg-amber-950/40 text-xs"
            onClick={() => setShowInsuranceModal(true)}
          >
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Submit Insurance Claim
          </Button>
        </div>
      </div>

      {showInsuranceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-100">Submit Insurance Claim</h2>
              <button type="button" onClick={() => { setShowInsuranceModal(false); setClaimSubmitted(false); }} className="text-zinc-400 hover:text-zinc-200 text-xl">×</button>
            </div>
            {claimSubmitted ? (
              <div className="space-y-2">
                <p className="text-sm text-emerald-400 font-semibold">Claim submitted successfully.</p>
                <p className="text-xs text-zinc-400">The campaign creator has submitted proof of failure. The insurance review process will evaluate your claim and pay out if eligible.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setClaimSubmitted(true);
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="evidence" className="block text-xs font-medium text-zinc-400 mb-1">Evidence of campaign failure</label>
                  <textarea
                    id="evidence"
                    required
                    rows={4}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="Describe why the campaign failed to meet its goals and provide any supporting evidence or links..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => { setShowInsuranceModal(false); setClaimSubmitted(false); }}>Cancel</Button>
                  <Button type="submit" size="sm" className="bg-amber-600 text-white hover:bg-amber-700">Submit Claim</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Hero Banner Header */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-purple-950/20 to-zinc-900 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <Badge className="bg-purple-600 text-white font-semibold text-xs">{campaign.category}</Badge>
              <Badge variant="outline" className="border-emerald-500 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="mr-1 h-3 w-3" /> {campaign.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Globe className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-[11px] uppercase tracking-wide text-zinc-500">
                Detected: {detectedLanguageName}
              </span>
              <select
                className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200"
                value={translationLang}
                onChange={(e) => setTranslationLang(e.target.value as TranslationKey | "")}
                aria-label="Translate campaign description"
              >
                <option value="">Original ({detectedLanguageName})</option>
                <option value="es">Spanish</option>
                <option value="pt">Portuguese</option>
                <option value="fr">French</option>
              </select>
            </div>

            <h1 lang={translationLang || detectedLang} className="text-3xl font-extrabold text-zinc-50 tracking-tight">
              {translation?.title ?? campaign.title}
            </h1>
            <p lang={translationLang || detectedLang} className="text-sm text-zinc-300 leading-relaxed">
              {translation?.shortDescription ?? campaign.shortDescription}
            </p>

            <div className="flex items-center gap-4 text-xs text-zinc-400 pt-2">
              <span>Created by: <strong className="text-zinc-200 font-mono">{campaign.creator}</strong></span>
              <span>Ends: <strong className="text-zinc-200">{campaign.endDate}</strong></span>
            </div>
          </div>

          {/* Raise Goal Card */}
          <div className="w-full md:w-80 rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-4 shadow-xl">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-zinc-400">Total Raised</span>
              <span className="text-xs font-bold text-emerald-400">{progressPct}% Funded</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-zinc-50">{campaign.raisedAmount}</span>
              <span className="text-sm font-semibold text-purple-400">{campaign.token}</span>
              <span className="text-xs text-zinc-500">/ {campaign.goalAmount}</span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-white hover:from-emerald-700 hover:to-teal-700 shadow-md">
              <Heart className="mr-2 h-4 w-4 fill-white" /> Sponsor This Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Funding Milestone Achievement Badges (25%, 50%, 75%, 100%) */}
      <CampaignMilestones
        raisedAmount={campaign.raisedAmount}
        goalAmount={campaign.goalAmount}
      />

      {/* Main Content Tabs (Overview, Sponsor Wall #724, Top Backers, Co-Creators #722) */}
      {/* Backer community spaces (#788) render inside the overview sidebar. */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1 md:grid-cols-4 xl:grid-cols-8">
          <TabsTrigger value="overview" className="text-xs font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Target className="mr-1.5 h-4 w-4" /> Overview & Story
          </TabsTrigger>
          <TabsTrigger value="sponsors" className="text-xs font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Heart className="mr-1.5 h-4 w-4 text-rose-400" /> Sponsor Wall (#724)
          </TabsTrigger>
          <TabsTrigger value="backers" className="text-xs font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Crown className="mr-1.5 h-4 w-4 text-amber-400" /> Top Backers
          </TabsTrigger>
          <TabsTrigger value="collaboration" className="text-xs font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Users className="mr-1.5 h-4 w-4 text-purple-400" /> Co-Creators (#722)
          </TabsTrigger>
          <TabsTrigger value="qa" className="text-xs font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <MessageSquare className="mr-1.5 h-4 w-4 text-purple-400" /> Q&A (#791)
          </TabsTrigger>
          <TabsTrigger value="success" className="text-xs font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Trophy className="mr-1.5 h-4 w-4 text-amber-400" /> Success Story
          </TabsTrigger>
          <TabsTrigger value="series" className="text-xs font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Sparkles className="mr-1.5 h-4 w-4 text-amber-400" /> Series & Sequels
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <BarChart3 className="mr-1.5 h-4 w-4 text-emerald-400" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3">
                <h3 className="text-lg font-bold text-zinc-100">Full Campaign Story</h3>
                <p
                  lang={translationLang || detectedLang}
                  className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line"
                >
                  {translation?.fullStory ?? campaign.fullStory}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-3">
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" /> Impact Statement & Beneficiaries
                </h3>
                <p
                  lang={translationLang || detectedLang}
                  className="text-sm text-amber-200/90 italic bg-amber-950/20 p-4 rounded-lg border border-amber-900/30"
                >
                  &ldquo;{translation?.impactStatement ?? campaign.impactStatement}&rdquo;
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                  <div>Beneficiaries: <strong className="text-zinc-100">{campaign.beneficiaries}</strong></div>
                  <div>Est. Water Provided: <strong className="text-amber-400 font-bold">{campaign.litersPerYear} L/yr</strong></div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <CampaignFundingVelocityChart
                data={[
                  { label: "Mon", raised: 2600 },
                  { label: "Tue", raised: 3000 },
                  { label: "Wed", raised: 4200 },
                  { label: "Thu", raised: 5800 },
                  { label: "Fri", raised: 7300 },
                  { label: "Sat", raised: 8100 },
                  { label: "Sun", raised: 9600 },
                ]}
                currency="XLM"
              />

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">Campaign Timeline</h4>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400">Start Date</span>
                    <strong className="text-zinc-100">{campaign.startDate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">End Date</span>
                    <strong className="text-zinc-100">{campaign.endDate}</strong>
                  </div>
                </div>
              </div>

              <BackerCommunity campaignId={campaign.id} canManage={isCreatorView} />
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Sponsor Wall (#724) */}
        <TabsContent value="sponsors">
          <CampaignSponsorWall campaignId={campaign.id} campaignTitle={campaign.title} />
        </TabsContent>

        {/* Tab 3: Top backers by amount, with creator featuring + privacy */}
        <TabsContent value="backers">
          <TopBackers
            campaignId={campaign.id}
            campaignTitle={campaign.title}
            creatorAddress={campaign.creator}
            viewerAddress={viewerAddress}
            limit={TOP_BACKERS_LIMIT}
          />
        </TabsContent>

        {/* Tab 4: Co-Creators Collaboration (#722) */}
        <TabsContent value="collaboration">
          <CampaignCollaboration campaignId={campaign.id} campaignTitle={campaign.title} />
        </TabsContent>

        {/* Tab 5: Q&A Moderation (#791) */}
        <TabsContent value="qa">
          <CampaignQAModeration campaignId={campaign.id} campaignTitle={campaign.title} />
        </TabsContent>

        {/* Tab 6: Success Story */}
        <TabsContent value="success" className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-800/60 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 p-6 md:p-8">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-600 text-white font-semibold text-xs">
                <Trophy className="mr-1 h-3 w-3" /> Featured Success Story
              </Badge>
            </div>
            <h3 className="text-2xl font-extrabold text-zinc-50 mt-4">{campaign.successStory.headline}</h3>
            <div className="mt-4 space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-400">Creator Interview</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{campaign.successStory.creatorInterview}</p>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
            <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" /> Backer Testimonials
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {campaign.successStory.backerTestimonials.map((testimonial) => (
                <figure key={testimonial.name} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <blockquote className="text-sm text-zinc-300 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</blockquote>
                  <figcaption className="mt-3 text-xs text-zinc-400">
                    <strong className="text-zinc-200">{testimonial.name}</strong> &middot; {testimonial.location}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab 7: Series & Sequels */}
        <TabsContent value="series">
          <CampaignSeries campaignId={campaign.id} campaignTitle={campaign.title} />
        </TabsContent>

        {/* Tab 8: Analytics for creators */}
        <TabsContent value="analytics">
          <CampaignAnalyticsDashboard campaignId={campaign.id} campaignTitle={campaign.title} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
