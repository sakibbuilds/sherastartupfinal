import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
        userPrompt = `Create a professional 60-second elevator pitch for the following startup:

Company Name: ${data.companyName || "Our startup"}
Problem: ${data.problemStatement || "Not specified"}
Solution: ${data.solution || "Not specified"}
Target Market: ${data.targetMarket || "Not specified"}
Unique Value: ${data.uniqueValue || "Not specified"}
Traction: ${data.traction || "Early stage"}
Ask: ${data.ask || "Not specified"}

Generate a natural, conversational pitch that flows well when spoken. Include a hook at the beginning and a clear call-to-action at the end.`;
        break;

      case "pitch-deck":
        systemPrompt = `You are an expert pitch deck consultant who has helped hundreds of startups raise funding. Generate detailed, investor-ready pitch deck content with compelling narratives for each slide. Focus on clear storytelling, data-driven insights, and persuasive content.`;
        userPrompt = `Create detailed content for a 10-slide pitch deck:

Company: ${data.companyName}
Industry: ${data.industry}
Stage: ${data.stage}
Problem: ${data.problemStatement}
Solution: ${data.solution}
Target Market: ${data.targetMarket}
Business Model: ${data.businessModel}
Traction: ${data.traction}
Team: ${data.team}
Funding Ask: ${data.fundingAsk}

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
        userPrompt = `Run a 12-month business simulation for:

Business Type: ${data.businessType}
Industry: ${data.industry}
Initial Investment: $${data.initialInvestment}
Monthly Revenue: $${data.monthlyRevenue}
Monthly Expenses: $${data.monthlyExpenses}
Market Growth Rate: ${data.marketGrowthRate}%
Number of Competitors: ${data.competitorCount}

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
        userPrompt = `Simulate an investment pitch and negotiation:

Company: ${data.companyName}
Industry: ${data.industry}
Stage: ${data.stage}
Current Revenue: $${data.currentRevenue}
Projected Revenue (Next Year): $${data.projectedRevenue}
Funding Amount Requested: $${data.fundingAmount}
Equity Offered: ${data.equityOffered}%
Use of Funds: ${data.useOfFunds}

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
        systemPrompt = `You are an expert pitch coach. Improve the given pitch while maintaining its core message. Make it more compelling, concise, and memorable.`;
        userPrompt = `Improve this elevator pitch while keeping its essence:

${data.currentPitch}

Make it more engaging with a stronger hook, clear, concise, memorable, and action-oriented. Return only the improved pitch.`;
        break;

      case "idea-validator":
        systemPrompt = `You are a startup idea validation expert with deep market research experience. Analyze startup ideas objectively, providing comprehensive market analysis, competitor research, and viability scoring. Be constructive but honest about weaknesses.`;
        userPrompt = `Validate this startup idea:

Idea Name: ${data.ideaName}
Description: ${data.ideaDescription}
Target Audience: ${data.targetAudience || "Not specified"}
Problem Solved: ${data.problemSolved}
Proposed Solution: ${data.proposedSolution || "Not specified"}
Revenue Model: ${data.revenueModel || "Not specified"}
Known Competitors: ${data.competitors || "Not specified"}

Provide validation results in JSON format:
{
  "overallScore": 75,
  "viabilityScore": 70,
  "marketScore": 80,
  "competitionScore": 65,
  "uniquenessScore": 75,
  "summary": "Executive summary of the validation",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "competitors": [
    {"name": "Competitor 1", "description": "...", "marketShare": "..."},
    {"name": "Competitor 2", "description": "...", "marketShare": "..."}
  ],
  "marketInsights": {
    "targetAudience": "Detailed audience analysis",
    "marketSize": "Estimated market size",
    "growthPotential": "Growth potential assessment",
    "entryBarriers": "Barriers to entry"
  },
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "verdict": "strong|moderate|weak"
}`;
        break;

      case "market-sizing":
        systemPrompt = `You are a market research analyst specializing in TAM/SAM/SOM calculations for startups. Provide data-driven market sizing estimates with clear methodologies and assumptions.`;
        userPrompt = `Calculate market size for:

Industry: ${data.industry}
Product/Service: ${data.productDescription}
Target Geography: ${data.targetGeography}
Target Segment: ${data.targetSegment || "Not specified"}
Pricing Model: ${data.pricingModel || "Not specified"}
Average Price: ${data.averagePrice || "Not specified"}
Competitors: ${data.competitors || "Not specified"}

Provide market sizing in JSON format:
{
  "tam": {
    "value": "$X billion",
    "description": "Total addressable market description",
    "methodology": "How TAM was calculated"
  },
  "sam": {
    "value": "$X million",
    "description": "Serviceable addressable market description",
    "methodology": "How SAM was calculated"
  },
  "som": {
    "value": "$X million",
    "description": "Serviceable obtainable market description",
    "methodology": "How SOM was calculated",
    "timeframe": "Year 1-3"
  },
  "marketGrowthRate": "X% CAGR",
  "keyDrivers": ["driver1", "driver2", "driver3"],
  "assumptions": ["assumption1", "assumption2"],
  "dataSources": ["source1", "source2"],
  "competitiveLandscape": "Overview of competitive landscape",
  "entryStrategy": "Recommended market entry strategy",
  "riskFactors": ["risk1", "risk2"]
}`;
        break;

      case "financial-projections":
        systemPrompt = `You are a startup financial analyst and CFO advisor. Create realistic financial projections based on industry benchmarks and growth patterns. Provide detailed multi-year forecasts with scenario analysis.`;
        userPrompt = `Generate financial projections:

Business Model: ${data.businessModel}
Current MRR: $${data.currentMRR}
Monthly Growth Rate: ${data.monthlyGrowthRate}%
Avg Revenue per Customer: $${data.averageRevenue || "Not specified"}
Customer Acquisition Cost: $${data.customerAcquisitionCost || "Not specified"}
Monthly Churn Rate: ${data.monthlyChurnRate || "5"}%
Gross Margin: ${data.grossMargin || "70"}%
Monthly Fixed Costs: $${data.monthlyFixedCosts || "Not specified"}
Current Headcount: ${data.currentHeadcount || "Not specified"}
Funding Raised: $${data.fundingRaised || "0"}
Projection Years: ${data.projectionYears || 3}

Provide projections in JSON format:
{
  "summary": "Executive summary",
  "projections": [
    {"year": 1, "revenue": 0, "expenses": 0, "grossProfit": 0, "netProfit": 0, "customers": 0, "employees": 0},
    {"year": 2, "revenue": 0, "expenses": 0, "grossProfit": 0, "netProfit": 0, "customers": 0, "employees": 0},
    {"year": 3, "revenue": 0, "expenses": 0, "grossProfit": 0, "netProfit": 0, "customers": 0, "employees": 0}
  ],
  "keyMetrics": {
    "cagr": "X%",
    "breakEvenMonth": "Month X",
    "burnRate": "$X/month",
    "runway": "X months",
    "ltv": "$X",
    "cac": "$X",
    "ltvCacRatio": "X:1"
  },
  "revenueDrivers": ["driver1", "driver2"],
  "costDrivers": ["driver1", "driver2"],
  "assumptions": ["assumption1", "assumption2"],
  "risks": ["risk1", "risk2"],
  "recommendations": ["rec1", "rec2"],
  "scenarioAnalysis": {
    "optimistic": {"year3Revenue": "$X", "description": "..."},
    "base": {"year3Revenue": "$X", "description": "..."},
    "pessimistic": {"year3Revenue": "$X", "description": "..."}
  }
}`;
        break;

      case "valuation-calculator":
        systemPrompt = `You are a startup valuation expert and investment banker. Calculate startup valuations using multiple methodologies including DCF, comparables, and VC method. Provide comprehensive analysis with comparable company data.`;
        userPrompt = `Calculate startup valuation:

Company: ${data.companyName}
Industry: ${data.industry}
Stage: ${data.stage}
Annual Revenue: $${data.annualRevenue}
Revenue Growth Rate: ${data.revenueGrowthRate || "Not specified"}%
Gross Margin: ${data.grossMargin || "Not specified"}%
EBITDA: $${data.ebitda || "Not specified"}
Total Users: ${data.totalUsers || "Not specified"}
Monthly Active Users: ${data.monthlyActiveUsers || "Not specified"}
Total Funding Raised: $${data.totalFundingRaised || "0"}
Last Valuation: $${data.lastValuation || "Not specified"}
Unique Advantages: ${data.uniqueAdvantages || "Not specified"}

Provide valuation in JSON format:
{
  "estimatedValuation": {
    "low": "$X million",
    "mid": "$X million",
    "high": "$X million"
  },
  "methodology": {
    "dcf": {"value": "$X", "weight": "X%", "reasoning": "..."},
    "comparables": {"value": "$X", "weight": "X%", "reasoning": "..."},
    "vcMethod": {"value": "$X", "weight": "X%", "reasoning": "..."}
  },
  "keyMultiples": {
    "revenueMultiple": "Xx",
    "ebitdaMultiple": "Xx",
    "userMultiple": "$X/user"
  },
  "comparableCompanies": [
    {"name": "Company A", "valuation": "$X", "revenue": "$X", "multiple": "Xx"}
  ],
  "valuationDrivers": ["driver1", "driver2"],
  "valuationRisks": ["risk1", "risk2"],
  "recommendations": ["rec1", "rec2"],
  "investorPerspective": "Analysis from investor point of view",
  "exitScenarios": [
    {"type": "Acquisition", "timeline": "X years", "potentialValue": "$X", "likelihood": "X%"}
  ]
}`;
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
        max_tokens: 3000,
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

    let result = content;
    if (toolType !== "elevator-pitch" && toolType !== "improve-pitch") {
      try {
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
