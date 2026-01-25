import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ElevatorPitchData {
  companyName: string;
  problemStatement: string;
  solution: string;
  targetMarket: string;
  uniqueValue: string;
  traction: string;
  ask: string;
}

interface PitchDeckData {
  companyName: string;
  industry: string;
  stage: string;
  problemStatement: string;
  solution: string;
  targetMarket: string;
  businessModel: string;
  traction: string;
  team: string;
  fundingAsk: string;
}

interface BizSimulationData {
  businessType: string;
  industry: string;
  initialInvestment: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  marketGrowthRate: number;
  competitorCount: number;
}

interface InvestmentSimulationData {
  companyName: string;
  industry: string;
  stage: string;
  currentRevenue: number;
  projectedRevenue: number;
  fundingAmount: number;
  equityOffered: number;
  useOfFunds: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { toolType, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (toolType) {
      case "elevator-pitch":
        systemPrompt = `You are an expert startup pitch coach. Generate compelling, concise elevator pitches that are approximately 60 seconds when spoken. The pitch should be engaging, memorable, and clearly communicate value proposition. Format the output as a natural, conversational pitch that founders can deliver confidently.`;
        
        const pitchData = data as ElevatorPitchData;
        userPrompt = `Create a professional 60-second elevator pitch for the following startup:

Company Name: ${pitchData.companyName || "Our startup"}
Problem: ${pitchData.problemStatement || "Not specified"}
Solution: ${pitchData.solution || "Not specified"}
Target Market: ${pitchData.targetMarket || "Not specified"}
Unique Value: ${pitchData.uniqueValue || "Not specified"}
Traction: ${pitchData.traction || "Early stage"}
Ask: ${pitchData.ask || "Not specified"}

Generate a natural, conversational pitch that flows well when spoken. Include a hook at the beginning and a clear call-to-action at the end.`;
        break;

      case "pitch-deck":
        systemPrompt = `You are an expert pitch deck consultant who has helped hundreds of startups raise funding. Generate detailed, investor-ready pitch deck content with compelling narratives for each slide. Focus on clear storytelling, data-driven insights, and persuasive content.`;
        
        const deckData = data as PitchDeckData;
        userPrompt = `Create detailed content for a 10-slide pitch deck:

Company: ${deckData.companyName}
Industry: ${deckData.industry}
Stage: ${deckData.stage}
Problem: ${deckData.problemStatement}
Solution: ${deckData.solution}
Target Market: ${deckData.targetMarket}
Business Model: ${deckData.businessModel}
Traction: ${deckData.traction}
Team: ${deckData.team}
Funding Ask: ${deckData.fundingAsk}

Generate content for each slide in JSON format:
{
  "slides": [
    {"title": "Title Slide", "content": "...", "speakerNotes": "..."},
    {"title": "Problem", "content": "...", "speakerNotes": "..."},
    {"title": "Solution", "content": "...", "speakerNotes": "..."},
    {"title": "Market Opportunity", "content": "...", "speakerNotes": "..."},
    {"title": "Business Model", "content": "...", "speakerNotes": "..."},
    {"title": "Traction", "content": "...", "speakerNotes": "..."},
    {"title": "Competition", "content": "...", "speakerNotes": "..."},
    {"title": "Team", "content": "...", "speakerNotes": "..."},
    {"title": "Financials", "content": "...", "speakerNotes": "..."},
    {"title": "The Ask", "content": "...", "speakerNotes": "..."}
  ]
}`;
        break;

      case "biz-simulation":
        systemPrompt = `You are a business strategist and financial analyst. Analyze business scenarios and provide detailed simulations with projections, risks, and recommendations. Use realistic assumptions and provide actionable insights.`;
        
        const bizData = data as BizSimulationData;
        userPrompt = `Run a 12-month business simulation for:

Business Type: ${bizData.businessType}
Industry: ${bizData.industry}
Initial Investment: $${bizData.initialInvestment}
Monthly Revenue: $${bizData.monthlyRevenue}
Monthly Expenses: $${bizData.monthlyExpenses}
Market Growth Rate: ${bizData.marketGrowthRate}%
Number of Competitors: ${bizData.competitorCount}

Provide simulation results in JSON format:
{
  "summary": "Executive summary of the simulation",
  "projections": {
    "month3": { "revenue": 0, "expenses": 0, "profit": 0, "cashBalance": 0 },
    "month6": { "revenue": 0, "expenses": 0, "profit": 0, "cashBalance": 0 },
    "month12": { "revenue": 0, "expenses": 0, "profit": 0, "cashBalance": 0 }
  },
  "risks": ["risk1", "risk2", "risk3"],
  "opportunities": ["opportunity1", "opportunity2", "opportunity3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "successProbability": 75,
  "breakEvenMonth": 8
}`;
        break;

      case "investment-simulation":
        systemPrompt = `You are a seasoned venture capitalist and investment expert. Simulate investment negotiations, evaluate startup valuations, and provide detailed feedback on pitch effectiveness. Be realistic but constructive.`;
        
        const investData = data as InvestmentSimulationData;
        userPrompt = `Simulate an investment pitch and negotiation:

Company: ${investData.companyName}
Industry: ${investData.industry}
Stage: ${investData.stage}
Current Revenue: $${investData.currentRevenue}
Projected Revenue (Next Year): $${investData.projectedRevenue}
Funding Amount Requested: $${investData.fundingAmount}
Equity Offered: ${investData.equityOffered}%
Use of Funds: ${investData.useOfFunds}

Provide simulation results in JSON format:
{
  "investorFeedback": "Detailed feedback from VC perspective",
  "valuationAnalysis": {
    "impliedValuation": 0,
    "industryComparable": 0,
    "recommendedValuation": 0,
    "valuationReasoning": "..."
  },
  "negotiationSimulation": [
    {"round": 1, "investorOffer": "...", "reasoning": "..."},
    {"round": 2, "counterOffer": "...", "reasoning": "..."},
    {"round": 3, "finalTerms": "...", "reasoning": "..."}
  ],
  "pitchScore": {
    "overall": 75,
    "problem": 80,
    "solution": 70,
    "market": 75,
    "team": 80,
    "financials": 70
  },
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "dealLikelihood": 65
}`;
        break;

      case "improve-pitch":
        systemPrompt = `You are an expert pitch coach. Improve the given pitch while maintaining its core message. Make it more compelling, concise, and memorable. Focus on strong opening hooks, clear value propositions, and compelling calls-to-action.`;
        userPrompt = `Improve this elevator pitch while keeping its essence:

${data.currentPitch}

Make it more:
1. Engaging with a stronger hook
2. Clear and concise
3. Memorable with vivid language
4. Persuasive with social proof if possible
5. Action-oriented with a clear ask

Return only the improved pitch, nothing else.`;
        break;

      default:
        throw new Error(`Unknown tool type: ${toolType}`);
    }

    console.log(`Processing ${toolType} request`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log(`Successfully processed ${toolType} request`);

    // For JSON responses, try to parse them
    let result = content;
    if (toolType !== "elevator-pitch" && toolType !== "improve-pitch") {
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                          content.match(/```\s*([\s\S]*?)\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : content;
        result = JSON.parse(jsonStr);
      } catch (e) {
        console.log("Response is not JSON, returning as text");
        result = content;
      }
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in startup-tools-ai:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
