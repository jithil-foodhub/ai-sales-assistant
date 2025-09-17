"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Calendar,
  MessageSquare,
  Brain,
  TrendingUp,
  Clock,
  CheckCircle,
  X,
  Eye,
  Lightbulb,
  Target,
  Zap,
  Users,
  ExternalLink,
  Activity,
  BarChart3,
  Globe,
  Upload,
  EyeIcon,
  Trash2,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ClientMetricsDashboard } from "@/components/ClientMetricsDashboard";
import LiveAISuggestions from "@/components/LiveAISuggestions";

interface Client {
  _id: string;
  phoneNumber: string;
  status: string;
  notes: string;
  createdAt: string;
  lastCallDate?: string;
  mood?: string;
  sentiment?: number;
}

interface CallRecord {
  _id: string;
  clientId: string;
  phoneNumber: string;
  timestamp: string;
  callStartTime?: string;
  callEndTime?: string;
  duration: number;
  transcript: string;
  mood: "positive" | "neutral" | "negative";
  sentiment: number;
  direction: "inbound" | "outbound";
  status:
    | "in_progress"
    | "completed"
    | "failed"
    | "no_answer"
    | "busy"
    | "declined";
  aiSuggestions: AISuggestion[];
  outcome: string;
  moodAnalysis?: {
    mood: "positive" | "neutral" | "negative";
    sentiment: number;
  };
  callAnalysis?: {
    summary: string;
    keyTopics: string[];
    customerEngagement: number;
    agentPerformance: number;
    conversationFlow: {
      segments: Array<{
        timestamp: number;
        speaker: "customer" | "agent";
        content: string;
        sentiment: number;
        topic?: string;
      }>;
    };
    metrics: {
      totalWords: number;
      customerWords: number;
      agentWords: number;
      speakingTimeRatio: number;
      averageResponseTime: number;
      interruptionCount: number;
      questionCount: number;
      objectionCount: number;
      agreementCount: number;
      solutionMentioned: boolean;
      nextStepsAgreed: boolean;
      customerSatisfaction: number;
    };
    insights: {
      strengths: string[];
      improvements: string[];
      recommendations: string[];
      riskFactors: string[];
    };
  };
  agentFeedback?: {
    performanceScore: number;
    strengths: string[];
    improvements: string[];
    conversationQuality: {
      rating: number;
      feedback: string;
    };
    salesTechniques: {
      rating: number;
      feedback: string;
      suggestions: string[];
    };
    customerHandling: {
      rating: number;
      feedback: string;
      suggestions: string[];
    };
    nextSteps: string[];
    overallFeedback: string;
  };
  callSummary?: {
    overallAssessment: string;
    customerTone: string;
    expectationsMet: boolean;
    conversionAttempt: string;
    keyOutcomes: string[];
    nextCallStrategy: string;
  };
  enhancedAnalysis?: {
    moodAnalysis: {
      mood: "positive" | "neutral" | "negative";
      confidence: number;
      reasoning: string;
    };
    competitorAnalysis: {
      competitors: Array<{
        name: string;
        highlights: string[];
        context: string;
      }>;
    };
    jargonDetection: {
      jargon: Array<{
        term: string;
        context: string;
        needsClarification: boolean;
      }>;
    };
    businessDetails: {
      cuisineTypes: string[];
      address: string;
      postcode: string;
      businessType: string;
    };
    keyInformation: {
      summary: string[];
      importantPoints: string[];
      actionItems: string[];
    };
  };
  metadata?: {
    callerId?: string;
    location?: string;
    device?: string;
    audioUrl?: string;
  };
}

interface AISuggestion {
  text: string;
  offer_id: string;
  type: string;
  confidence: number;
  deliver_as: "say" | "show" | "email";
  reasoning?: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;

  const [client, setClient] = useState<Client | null>(null);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [currentCall, setCurrentCall] = useState<CallRecord | null>(null);
  const [liveSuggestions, setLiveSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<string | null>(
    null
  );
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<
    AISuggestion[]
  >([]);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"calls" | "metrics" | "website">(
    "calls"
  );

  // Website generation state
  const [isAnalyzingPreferences, setIsAnalyzingPreferences] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const [personalizedContent, setPersonalizedContent] = useState<any>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");

  // Website modification state
  const [modificationRequest, setModificationRequest] = useState<string>("");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [clientWebsites, setClientWebsites] = useState<any[]>([]);

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<{
    [callId: string]: {
      agentFeedback: boolean;
      callSummary: boolean;
    };
  }>({});

  // Toggle expanded sections
  const toggleSection = (
    callId: string,
    section: "agentFeedback" | "callSummary"
  ) => {
    setExpandedSections((prev) => ({
      ...prev,
      [callId]: {
        ...prev[callId],
        [section]: !prev[callId]?.[section],
      },
    }));
  };

  const isSectionExpanded = (
    callId: string,
    section: "agentFeedback" | "callSummary"
  ) => {
    return expandedSections[callId]?.[section] || false;
  };

  // Format duration for display
  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  useEffect(() => {
    fetchClientData();
    setupWebSocket();
    loadClientWebsites();
  }, [agentId]);

  const fetchClientData = async () => {
    try {
      const [clientRes, callsRes] = await Promise.all([
        fetch(`/api/clients/${agentId}`),
        fetch(`/api/clients/${agentId}/calls`),
      ]);

      const clientData = await clientRes.json();
      const callsData = await callsRes.json();

      if (clientData.success) {
        setClient(clientData.data);
      }

      if (callsData.success) {
        // Filter out calls with empty/null transcripts and calculate duration
        const filteredCalls = callsData.data
          .filter(
            (call: CallRecord) =>
              call.transcript &&
              call.transcript.trim().length > 0 &&
              call.transcript !== "Call ended without completion"
          )
          .map((call: CallRecord) => {
            // Calculate duration from callStartTime and callEndTime if available
            if (call.callStartTime && call.callEndTime) {
              const startTime = new Date(call.callStartTime).getTime();
              const endTime = new Date(call.callEndTime).getTime();
              const calculatedDuration = Math.round(
                (endTime - startTime) / 1000
              ); // Convert to seconds

              return {
                ...call,
                duration:
                  calculatedDuration > 0 ? calculatedDuration : call.duration,
              };
            }
            return call;
          });

        setCallHistory(filteredCalls);
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebSocket = () => {
    const ws = new WebSocket("ws://localhost:3000/ws");

    ws.onopen = () => {
      setIsConnected(true);
      console.log("🔌 Connected to WebSocket for client details");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("📨 Client detail message received:", message);

        // Handle live transcript chunks for this specific client
        if (message.type === "live_transcript_chunk") {
          console.log(
            `📝 Live transcript [${message.speaker || "Unknown"}]: "${
              message.transcript
            }"`
          );

          // Set current call SID if not set, or if this is a new call
          if (!currentCallSid || currentCallSid !== message.callSid) {
            setCurrentCallSid(message.callSid);
            console.log(`🆔 Setting current call SID: ${message.callSid}`);
          }

          // Only process if this is the current call
          if (currentCallSid === null || message.callSid === currentCallSid) {
            setCurrentCall((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                callSid: message.callSid || "unknown",
                speaker: message.speaker || "Unknown",
                transcript: message.transcript,
                fullTranscript: message.fullTranscript || message.transcript,
                confidence: message.confidence || 0.5,
              };
            });
          }
        }

        // Handle live analysis with AI suggestions for this client
        if (message.type === "live_analysis") {
          console.log(
            `🤖 Live analysis for client ${agentId}: ${
              message.moodAnalysis?.mood || "unknown"
            } mood`
          );
          console.log(
            `🤖 Call SID: ${message.callSid}, Current: ${currentCallSid}`
          );

          // Only process if this is the current call or if no current call is set
          if (currentCallSid === null || message.callSid === currentCallSid) {
            console.log(`✅ Processing suggestions for current call`);
            setLiveSuggestions(message.suggestions || []);
          } else {
            console.log(`⏭️ Skipping suggestions for different call`);
          }
        }

        // Handle final analysis
        if (
          message.type === "final_analysis" &&
          message.callRecord?.clientId === agentId
        ) {
          console.log(`✅ Final analysis complete for client ${agentId}`);

          // Only add call if it has a valid transcript
          if (
            message.callRecord.transcript &&
            message.callRecord.transcript.trim().length > 0 &&
            message.callRecord.transcript !== "Call ended without completion"
          ) {
            // Calculate duration from callStartTime and callEndTime if available
            let callRecord = { ...message.callRecord };
            if (callRecord.callStartTime && callRecord.callEndTime) {
              const startTime = new Date(callRecord.callStartTime).getTime();
              const endTime = new Date(callRecord.callEndTime).getTime();
              const calculatedDuration = Math.round(
                (endTime - startTime) / 1000
              ); // Convert to seconds

              callRecord.duration =
                calculatedDuration > 0
                  ? calculatedDuration
                  : callRecord.duration;
            }

            setCallHistory((prev) => [callRecord, ...prev]);
          }
          setLiveSuggestions([]);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("🔌 WebSocket disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "product_recommendation":
        return <TrendingUp className="w-5 h-5" />;
      case "solution_consultation":
        return <Brain className="w-5 h-5" />;
      case "business_growth":
        return <TrendingUp className="w-5 h-5" />;
      case "pricing_inquiry":
        return <Clock className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case "product_recommendation":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "solution_consultation":
        return "bg-green-100 text-green-800 border-green-200";
      case "business_growth":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "pricing_inquiry":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Website generation functions
  const analyzePreferences = async () => {
    try {
      setIsAnalyzingPreferences(true);
      const response = await fetch(`/api/clients/${agentId}/preferences`);
      const data = await response.json();

      if (data.success) {
        setPreferences(data.data.preferences);
        setPersonalizedContent(data.data.personalizedContent);
      }
    } catch (error) {
      console.error("Error analyzing preferences:", error);
    } finally {
      setIsAnalyzingPreferences(false);
    }
  };

  const generateWebsite = async () => {
    try {
      setIsAnalyzingPreferences(true);
      const response = await fetch(`/api/clients/${agentId}/generate-website`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName }),
      });
      const data = await response.json();

      if (data.success) {
        setPreferences(data.data.preferences);
        setPersonalizedContent(data.data.personalizedContent);
        setGeneratedHtml(data.data.html);
        setPreviewUrl(data.data.previewUrl);
        setFilePath(data.data.filePath);
      }
    } catch (error) {
      console.error("Error generating website:", error);
    } finally {
      setIsAnalyzingPreferences(false);
    }
  };

  const deployWebsite = async () => {
    try {
      setIsDeploying(true);
      const response = await fetch(`/api/clients/${agentId}/deploy-website`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: filePath,
          clientName,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setDeployedUrl(data.data.deployedUrl);
        loadClientWebsites(); // Reload websites after deployment
      }
    } catch (error) {
      console.error("Error deploying website:", error);
    } finally {
      setIsDeploying(false);
    }
  };

  const loadClientWebsites = async () => {
    try {
      const response = await fetch(`/api/clients/${agentId}/sites`);
      const data = await response.json();

      if (data.success) {
        setClientWebsites(data.data);
        // Set the most recent website as deployed URL
        if (data.data.length > 0) {
          const activeWebsite =
            data.data.find((site: any) => site.isActive) || data.data[0];
          setDeployedUrl(activeWebsite.url);
        }
      }
    } catch (error) {
      console.error("Error loading client websites:", error);
    }
  };

  const generatePreview = async () => {
    if (!modificationRequest.trim()) {
      alert("Please enter a modification request");
      return;
    }

    try {
      setIsGeneratingPreview(true);
      const response = await fetch(`/api/clients/${agentId}/generate-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modificationRequest: modificationRequest.trim(),
        }),
      });
      const data = await response.json();

      if (data.success) {
        setPreviewResult(data.data);
        setPreviewUrl(data.data.previewUrl);
        setFilePath(data.data.fileName);

        // Automatically open preview in new tab
        window.open(data.data.previewUrl, "_blank");
      } else {
        alert(data.error || "Failed to generate preview");
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      alert("Error generating preview");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const generateAndPreviewModification = async () => {
    if (!modificationRequest.trim()) {
      alert("Please enter a modification request");
      return;
    }

    try {
      setIsGeneratingPreview(true);
      const response = await fetch(`/api/clients/${agentId}/generate-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modificationRequest: modificationRequest.trim(),
        }),
      });
      const data = await response.json();

      if (data.success) {
        setPreviewResult(data.data);
        setPreviewUrl(data.data.previewUrl);
        setFilePath(data.data.fileName);

        // Automatically open preview in new tab
        window.open(data.data.previewUrl, "_blank");
      } else {
        alert(data.error || "Failed to generate preview");
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      alert("Error generating preview");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const deployModifiedWebsite = async () => {
    if (!filePath) {
      alert("No website to deploy. Please generate a preview first.");
      return;
    }

    try {
      setIsDeploying(true);
      const response = await fetch(`/api/clients/${agentId}/deploy-website`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: filePath,
          clientName,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setDeployedUrl(data.data.deployedUrl);
        setPreviewResult(null); // Clear preview result
        setModificationRequest(""); // Clear the input
        loadClientWebsites(); // Reload websites
      } else {
        alert(data.error || "Failed to deploy website");
      }
    } catch (error) {
      console.error("Error deploying website:", error);
      alert("Error deploying website");
    } finally {
      setIsDeploying(false);
    }
  };

  const deleteWebsite = async (websiteId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this website? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${agentId}/delete-website`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId: websiteId,
        }),
      });
      const data = await response.json();

      if (data.success) {
        // If the deleted website was the active one, clear the deployed URL
        const deletedWebsite = clientWebsites.find((w) => w._id === websiteId);
        if (deletedWebsite && deletedWebsite.isActive) {
          setDeployedUrl(null);
          setPreviewResult(null);
          setModificationRequest("");
        }

        loadClientWebsites(); // Reload websites
        alert("Website deleted successfully");
      } else {
        alert(data.error || "Failed to delete website");
      }
    } catch (error) {
      console.error("Error deleting website:", error);
      alert("Error deleting website");
    }
  };

  const openTranscriptModal = (transcript: string) => {
    setSelectedTranscript(transcript);
    setIsTranscriptModalOpen(true);
  };

  const closeTranscriptModal = () => {
    setSelectedTranscript(null);
    setIsTranscriptModalOpen(false);
  };

  const openSuggestionsModal = (suggestions: AISuggestion[]) => {
    setSelectedSuggestions(suggestions);
    setIsSuggestionsModalOpen(true);
  };

  const closeSuggestionsModal = () => {
    setSelectedSuggestions([]);
    setIsSuggestionsModalOpen(false);
  };

  if (isLoading) {
    return (
      <AppLayout currentScreen="clients">
        <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading client details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout currentScreen="clients">
        <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Client Not Found
            </h2>
            <p className="text-slate-600 mb-4">
              The requested client could not be found.
            </p>
            <button
              onClick={() => router.push("/clients")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Clients
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentScreen="clients">
      <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push("/clients")}
                  className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Clients
                </button>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">
                    {client.phoneNumber}
                  </h1>
                  <p className="text-xl text-slate-600">
                    Client Details & AI Suggestions
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div
                  className={`flex items-center px-3 py-2 rounded-lg ${
                    isConnected
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  {isConnected ? "Live" : "Disconnected"}
                </div>
              </div>
            </div>
          </div>

          {/* Live AI Suggestions - Top Priority */}
          <div className="mb-8">
            <LiveAISuggestions
              agentId={agentId}
              callSid={currentCallSid || undefined}
              className="w-full"
              showHeader={true}
              maxSuggestions={3}
            />
          </div>

          {/* Client Info Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-8">
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Client Details */}
                <div className="lg:col-span-3">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">
                    Client Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm text-slate-500 font-medium">
                        Phone Number
                      </span>
                      <span className="text-base font-semibold text-slate-900">
                        {client.phoneNumber}
                      </span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm text-slate-500 font-medium">
                        Status
                      </span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium w-fit ${
                          client.status === "prospect"
                            ? "bg-yellow-100 text-yellow-800"
                            : client.status === "lead"
                            ? "bg-blue-100 text-blue-800"
                            : client.status === "customer"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {client.status}
                      </span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm text-slate-500 font-medium">
                        Created
                      </span>
                      <span className="text-base text-slate-900">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {client.lastCallDate && (
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-slate-500 font-medium">
                          Last Call
                        </span>
                        <span className="text-base text-slate-900">
                          {new Date(client.lastCallDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {client.mood && (
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-slate-500 font-medium">
                          Mood
                        </span>
                        <span
                          className={`text-base font-semibold ${
                            client.mood === "positive"
                              ? "text-green-600"
                              : client.mood === "neutral"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {client.mood}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="lg:col-span-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-3xl font-bold text-slate-900 mb-2">
                        {callHistory.length}
                      </div>
                      <div className="text-sm text-slate-600 font-medium">
                        Total Calls
                      </div>
                    </div>
                    <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-3xl font-bold text-slate-900 mb-2">
                        {callHistory.length > 0
                          ? Math.round(
                              callHistory.reduce(
                                (sum, call) => sum + call.duration,
                                0
                              ) /
                                callHistory.length /
                                60
                            )
                          : 0}
                        m
                      </div>
                      <div className="text-sm text-slate-600 font-medium">
                        Avg Duration
                      </div>
                    </div>
                    <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-3xl font-bold text-slate-900 mb-2">
                        {
                          callHistory.filter(
                            (call) => call.outcome === "successful"
                          ).length
                        }
                      </div>
                      <div className="text-sm text-slate-600 font-medium">
                        Successful
                      </div>
                    </div>
                    <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-3xl font-bold text-slate-900 mb-2">
                        {liveSuggestions.length}
                      </div>
                      <div className="text-sm text-slate-600 font-medium">
                        Live Suggestions
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="lg:col-span-3">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">
                    Connection Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <span className="text-sm text-slate-500 font-medium">
                        WebSocket
                      </span>
                      <div
                        className={`flex items-center px-4 py-2 rounded-lg w-fit ${
                          isConnected
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            isConnected ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></div>
                        {isConnected ? "Connected" : "Disconnected"}
                      </div>
                    </div>
                    {currentCallSid && (
                      <div className="flex flex-col space-y-2">
                        <span className="text-sm text-slate-500 font-medium">
                          Current Call
                        </span>
                        <span className="text-xs font-mono text-slate-700 bg-slate-100 px-3 py-2 rounded-lg w-fit">
                          {currentCallSid.substring(0, 8)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {client.notes && (
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">
                    Notes
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {client.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab("calls")}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "calls"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Call History
              </button>
              <button
                onClick={() => setActiveTab("metrics")}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "metrics"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Metrics & Analytics
              </button>
              <button
                onClick={() => setActiveTab("website")}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "website"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Globe className="w-4 h-4 inline mr-2" />
                Website Generator
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "metrics" ? (
            <ClientMetricsDashboard
              clientId={agentId as string}
              callRecords={callHistory}
            />
          ) : activeTab === "website" ? (
            <div className="space-y-6">
              {/* Website Management */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Website Management
                      </h3>
                      <p className="text-sm text-slate-500">
                        Manage and modify client websites
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Website Status */}
                {deployedUrl ? (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-green-900">
                          Website is Live
                        </h4>
                        <p className="text-sm text-green-700">
                          Your website is currently deployed and accessible
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <a
                          href={deployedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>View Live Website</span>
                        </a>
                        {clientWebsites.length > 0 && (
                          <button
                            onClick={() => {
                              const activeWebsite = clientWebsites.find(
                                (w) => w.isActive
                              );
                              if (activeWebsite) {
                                deleteWebsite(activeWebsite._id);
                              }
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Website</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            No Website Deployed
                          </h4>
                          <p className="text-sm text-slate-600">
                            Generate a website first to enable modifications
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={analyzePreferences}
                          disabled={isAnalyzingPreferences}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Brain className="w-4 h-4" />
                          <span>
                            {isAnalyzingPreferences
                              ? "Analyzing..."
                              : "Analyze Preferences"}
                          </span>
                        </button>

                        <button
                          onClick={generateWebsite}
                          disabled={isAnalyzingPreferences}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Globe className="w-4 h-4" />
                          <span>
                            {isAnalyzingPreferences
                              ? "Generating..."
                              : "Generate Website"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Client Name Input - Show when no website is deployed */}
                {!deployedUrl && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Client Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Enter client name for personalization"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Preferences Display */}
                {preferences && !deployedUrl && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-900 mb-3">
                      Analyzed Preferences
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Cuisine Types
                        </p>
                        <p className="text-sm text-slate-800">
                          {preferences.cuisineTypes?.join(", ") ||
                            "None detected"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Price Range
                        </p>
                        <p className="text-sm text-slate-800 capitalize">
                          {preferences.priceRange || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Dietary Restrictions
                        </p>
                        <p className="text-sm text-slate-800">
                          {preferences.dietaryRestrictions?.join(", ") ||
                            "None"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          Frequency
                        </p>
                        <p className="text-sm text-slate-800 capitalize">
                          {preferences.frequency || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview Section - Show when website is generated but not deployed */}
                {previewUrl && !deployedUrl && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-3">
                      Website Generated Successfully!
                    </h4>
                    <div className="flex items-center space-x-4">
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>Preview Website</span>
                      </a>

                      <button
                        onClick={deployWebsite}
                        disabled={isDeploying}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-4 h-4" />
                        <span>
                          {isDeploying ? "Deploying..." : "Deploy to S3"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Website Modification */}
                {deployedUrl && (
                  <div className="space-y-6">
                    <div className="border-t border-slate-200 pt-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Brain className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-purple-900">
                            AI Website Modification
                          </h4>
                          <p className="text-sm text-purple-600">
                            Describe what you want to change and preview before
                            deploying
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            What would you like to change?
                          </label>
                          <textarea
                            value={modificationRequest}
                            onChange={(e) =>
                              setModificationRequest(e.target.value)
                            }
                            placeholder="e.g., 'Change the hero title to be more welcoming', 'Add more Italian cuisine options', 'Make the colors more vibrant'"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                            rows={3}
                          />
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={generateAndPreviewModification}
                            disabled={
                              isGeneratingPreview || !modificationRequest.trim()
                            }
                            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Brain className="w-4 h-4" />
                            <span>
                              {isGeneratingPreview
                                ? "AI is Working..."
                                : "Generate & Preview"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Preview Result */}
                    {previewResult && (
                      <div className="border-t border-slate-200 pt-6">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <h5 className="font-semibold text-green-900">
                              Preview Generated & Opened!
                            </h5>
                          </div>

                          <div className="space-y-4">
                            {/* Modifications List */}
                            {previewResult.modifications && (
                              <div>
                                <h6 className="text-sm font-medium text-green-700 mb-2">
                                  Changes Made:
                                </h6>
                                <ul className="space-y-2">
                                  {previewResult.modifications.map(
                                    (mod: any, index: number) => (
                                      <li
                                        key={index}
                                        className="flex items-start space-x-2 text-sm"
                                      >
                                        <div
                                          className={`w-2 h-2 rounded-full mt-2 ${
                                            mod.priority === "high"
                                              ? "bg-red-400"
                                              : mod.priority === "medium"
                                              ? "bg-yellow-400"
                                              : "bg-green-400"
                                          }`}
                                        ></div>
                                        <div>
                                          <span className="font-medium text-green-800">
                                            {mod.section}
                                          </span>
                                          <span className="text-green-600">
                                            {" "}
                                            - {mod.description}
                                          </span>
                                        </div>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                            {/* Reasoning */}
                            {previewResult.reasoning && (
                              <div>
                                <h6 className="text-sm font-medium text-green-700 mb-2">
                                  AI Reasoning:
                                </h6>
                                <p className="text-sm text-green-600 bg-white p-3 rounded-lg border border-green-200">
                                  {previewResult.reasoning}
                                </p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-4 pt-4 border-t border-green-200">
                              <a
                                href={previewResult.previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                <EyeIcon className="w-4 h-4" />
                                <span>Open Preview Again</span>
                              </a>

                              <button
                                onClick={deployModifiedWebsite}
                                disabled={isDeploying}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Upload className="w-4 h-4" />
                                <span>
                                  {isDeploying
                                    ? "Deploying..."
                                    : "Deploy Changes"}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Website History */}
                {clientWebsites.length > 0 && (
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">
                      Website History
                    </h4>
                    <div className="space-y-3">
                      {clientWebsites.map((website, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                website.isActive
                                  ? "bg-green-400"
                                  : "bg-slate-300"
                              }`}
                            ></div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {website.fileName}
                              </p>
                              <p className="text-xs text-slate-500">
                                Deployed:{" "}
                                {new Date(website.deployedAt).toLocaleString()}
                                {website.lastModified && (
                                  <span>
                                    {" "}
                                    • Modified:{" "}
                                    {new Date(
                                      website.lastModified
                                    ).toLocaleString()}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <a
                              href={website.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 px-3 py-1 bg-white text-slate-700 rounded-lg hover:bg-slate-100 text-sm border border-slate-200"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View</span>
                            </a>
                            <button
                              onClick={() => deleteWebsite(website._id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm border border-red-200"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Enhanced Analysis Section */}
              {currentCall?.enhancedAnalysis && (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                  <h4 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                    <Activity className="w-6 h-6 mr-3 text-blue-600" />
                    Enhanced Call Analysis
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mood Analysis */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <h5 className="text-base font-semibold text-blue-900">
                          Call Mood
                        </h5>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700 font-medium">
                            Mood:
                          </span>
                          <span
                            className={`text-sm font-semibold px-3 py-1 rounded-full ${
                              currentCall.enhancedAnalysis.moodAnalysis.mood ===
                              "positive"
                                ? "bg-green-100 text-green-700"
                                : currentCall.enhancedAnalysis.moodAnalysis
                                    .mood === "negative"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {currentCall.enhancedAnalysis.moodAnalysis.mood}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700 font-medium">
                            Confidence:
                          </span>
                          <span className="text-sm font-semibold text-slate-900">
                            {Math.round(
                              currentCall.enhancedAnalysis.moodAnalysis
                                .confidence * 100
                            )}
                            %
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                          {currentCall.enhancedAnalysis.moodAnalysis.reasoning}
                        </p>
                      </div>
                    </div>

                    {/* Competitor Analysis */}
                    {currentCall.enhancedAnalysis.competitorAnalysis.competitors
                      .length > 0 && (
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100 p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Users className="w-5 h-5 text-orange-600" />
                          </div>
                          <h5 className="text-base font-semibold text-orange-900">
                            Competitors Mentioned
                          </h5>
                        </div>
                        <div className="space-y-3">
                          {currentCall.enhancedAnalysis.competitorAnalysis.competitors.map(
                            (competitor, index) => (
                              <div
                                key={index}
                                className="bg-white rounded-lg p-4 border border-orange-200"
                              >
                                <div className="font-semibold text-sm text-slate-900 mb-2">
                                  {competitor.name}
                                </div>
                                <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                                  {competitor.context}
                                </p>
                                {competitor.highlights.length > 0 && (
                                  <div className="mt-2">
                                    <span className="text-xs text-slate-500 font-medium">
                                      Highlights:
                                    </span>
                                    <ul className="text-xs text-slate-600 mt-1 space-y-1">
                                      {competitor.highlights.map(
                                        (highlight, idx) => (
                                          <li
                                            key={idx}
                                            className="flex items-start space-x-2"
                                          >
                                            <span className="text-orange-500 mt-0.5">
                                              •
                                            </span>
                                            <span>{highlight}</span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Business Details */}
                    {(currentCall.enhancedAnalysis.businessDetails.cuisineTypes
                      .length > 0 ||
                      currentCall.enhancedAnalysis.businessDetails.address ||
                      currentCall.enhancedAnalysis.businessDetails
                        .businessType) && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Globe className="w-5 h-5 text-green-600" />
                          </div>
                          <h5 className="text-base font-semibold text-green-900">
                            Business Details
                          </h5>
                        </div>
                        <div className="space-y-3">
                          {currentCall.enhancedAnalysis.businessDetails
                            .cuisineTypes.length > 0 && (
                            <div>
                              <span className="text-xs text-slate-500 font-medium">
                                Cuisine Types:
                              </span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {currentCall.enhancedAnalysis.businessDetails.cuisineTypes.map(
                                  (cuisine, index) => (
                                    <span
                                      key={index}
                                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                                    >
                                      {cuisine}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                          {currentCall.enhancedAnalysis.businessDetails
                            .address && (
                            <div>
                              <span className="text-xs text-slate-500 font-medium">
                                Address:
                              </span>
                              <p className="text-sm text-slate-900 mt-1">
                                {
                                  currentCall.enhancedAnalysis.businessDetails
                                    .address
                                }
                              </p>
                            </div>
                          )}
                          {currentCall.enhancedAnalysis.businessDetails
                            .businessType && (
                            <div>
                              <span className="text-xs text-slate-500 font-medium">
                                Business Type:
                              </span>
                              <p className="text-sm text-slate-900 mt-1">
                                {
                                  currentCall.enhancedAnalysis.businessDetails
                                    .businessType
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Key Information */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Lightbulb className="w-5 h-5 text-purple-600" />
                        </div>
                        <h5 className="text-base font-semibold text-purple-900">
                          Key Information
                        </h5>
                      </div>
                      <div className="space-y-4">
                        {currentCall.enhancedAnalysis.keyInformation.summary
                          .length > 0 && (
                          <div>
                            <span className="text-xs text-slate-500 font-semibold">
                              Summary:
                            </span>
                            <ul className="text-xs text-slate-700 mt-2 space-y-1">
                              {currentCall.enhancedAnalysis.keyInformation.summary.map(
                                (item, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start space-x-2"
                                  >
                                    <span className="text-purple-500 mt-0.5">
                                      •
                                    </span>
                                    <span>{item}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                        {currentCall.enhancedAnalysis.keyInformation.actionItems
                          .length > 0 && (
                          <div>
                            <span className="text-xs text-slate-500 font-semibold">
                              Action Items:
                            </span>
                            <ul className="text-xs text-slate-700 mt-2 space-y-1">
                              {currentCall.enhancedAnalysis.keyInformation.actionItems.map(
                                (item, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start space-x-2"
                                  >
                                    <span className="text-pink-500 mt-0.5">
                                      →
                                    </span>
                                    <span>{item}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Call History */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
                <div className="p-8 border-b border-slate-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        Call History
                      </h3>
                      <p className="text-sm text-slate-500">
                        {callHistory.length} calls recorded
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {callHistory.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-slate-400" />
                      </div>
                      <h4 className="text-xl font-medium text-slate-900 mb-3">
                        No Call History
                      </h4>
                      <p className="text-slate-500">
                        Call records will appear here after conversations
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {callHistory.map((call) => (
                        <div
                          key={call._id}
                          className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
                        >
                          {/* Call Header */}
                          <div className="p-6 border-b border-slate-200 bg-white/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      call.direction === "inbound"
                                        ? "bg-green-400"
                                        : "bg-blue-400"
                                    }`}
                                  ></div>
                                  <span className="text-sm font-semibold text-slate-700 capitalize">
                                    {call.direction} Call
                                  </span>
                                </div>
                                <div className="text-sm text-slate-600">
                                  {new Date(call.timestamp).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </div>
                                {call.callStartTime && (
                                  <div className="text-sm text-slate-600">
                                    Start:{" "}
                                    {new Date(
                                      call.callStartTime
                                    ).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                )}
                                {call.callEndTime && (
                                  <div className="text-sm text-slate-600">
                                    End:{" "}
                                    {new Date(
                                      call.callEndTime
                                    ).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                )}
                                <div className="text-sm text-slate-600">
                                  {formatDuration(call.duration || 0)}
                                </div>
                              </div>

                              {call.moodAnalysis && (
                                <div className="flex items-center space-x-3">
                                  <div className="text-right">
                                    <div
                                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                                        call.moodAnalysis.mood === "positive"
                                          ? "bg-green-100 text-green-700"
                                          : call.moodAnalysis.mood ===
                                            "negative"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-yellow-100 text-yellow-700"
                                      }`}
                                    >
                                      <div
                                        className={`w-2 h-2 rounded-full mr-2 ${
                                          call.moodAnalysis.mood === "positive"
                                            ? "bg-green-500"
                                            : call.moodAnalysis.mood ===
                                              "negative"
                                            ? "bg-red-500"
                                            : "bg-yellow-500"
                                        }`}
                                      ></div>
                                      {call.moodAnalysis.mood}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                      Sentiment:{" "}
                                      {Math.round(
                                        (call.moodAnalysis.sentiment || 0) * 100
                                      )}
                                      %
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Call Content */}
                          <div className="p-6 space-y-6">
                            {/* Transcript Section */}
                            {call.transcript && (
                              <div className="bg-white rounded-lg border border-slate-200 p-5">
                                <div className="flex items-center justify-between mb-4">
                                  <h5 className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
                                    <MessageSquare className="w-4 h-4" />
                                    <span>Conversation</span>
                                  </h5>
                                  <button
                                    onClick={() =>
                                      openTranscriptModal(call.transcript)
                                    }
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span>View Full</span>
                                  </button>
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                  {call.transcript.length > 150
                                    ? `${call.transcript.substring(0, 150)}...`
                                    : call.transcript}
                                </p>
                              </div>
                            )}

                            {/* AI Suggestions Section */}
                            {call.aiSuggestions &&
                              call.aiSuggestions.length > 0 && (
                                <div className="bg-white rounded-lg border border-slate-200 p-5">
                                  <div className="flex items-center justify-between mb-4">
                                    <h5 className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
                                      <Lightbulb className="w-4 h-4" />
                                      <span>
                                        AI Suggestions (
                                        {call.aiSuggestions.length})
                                      </span>
                                    </h5>
                                    <button
                                      onClick={() =>
                                        openSuggestionsModal(call.aiSuggestions)
                                      }
                                      className="flex items-center space-x-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                                    >
                                      <Lightbulb className="w-4 h-4" />
                                      <span>View All</span>
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {call.aiSuggestions
                                      .slice(0, 2)
                                      .map((suggestion, index) => (
                                        <div
                                          key={index}
                                          className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100 hover:shadow-sm transition-shadow"
                                        >
                                          <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                              <div className="p-1 bg-purple-100 rounded">
                                                {getSuggestionIcon(
                                                  suggestion.type
                                                )}
                                              </div>
                                              <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                                                {suggestion.type
                                                  .replace("_", " ")
                                                  .toUpperCase()}
                                              </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                              <span className="text-xs text-slate-500">
                                                {(
                                                  suggestion.confidence * 100
                                                ).toFixed(0)}
                                                %
                                              </span>
                                            </div>
                                          </div>
                                          <p className="text-sm text-slate-800 mb-3 line-clamp-2 leading-relaxed">
                                            {suggestion.text}
                                          </p>
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                              {suggestion.deliver_as}
                                            </span>
                                            <span className="text-slate-400 font-mono">
                                              {suggestion.offer_id}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    {call.aiSuggestions.length > 2 && (
                                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-4 flex items-center justify-center">
                                        <span className="text-sm text-slate-500 font-medium">
                                          +{call.aiSuggestions.length - 2} more
                                          suggestions
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Call Analysis Summary */}
                            {call.callAnalysis && call.callAnalysis.summary && (
                              <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
                                <h5 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-5">
                                  <Activity className="w-5 h-5" />
                                  <span>Call Analysis</span>
                                </h5>

                                {/* Summary */}
                                <div className="mb-6">
                                  <p className="text-base text-slate-900 font-semibold mb-2">
                                    Summary
                                  </p>
                                  <div className="bg-slate-50 p-4 rounded-lg text-slate-700 text-sm leading-relaxed">
                                    {call.callAnalysis.summary}
                                  </div>
                                </div>

                                {/* Key Metrics */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                  {/* Client Engagement */}
                                  <div className="flex flex-col items-center text-center">
                                    <p className="text-xs text-slate-500 mb-1">
                                      Client Engagement
                                    </p>
                                    <span className="text-2xl font-bold text-blue-600 mb-1">
                                      {Math.round(
                                        (call.callAnalysis.customerEngagement ||
                                          0) * 100
                                      )}
                                      %
                                    </span>
                                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                                      <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${Math.min(
                                            (call.callAnalysis
                                              .customerEngagement || 0) * 100,
                                            100
                                          )}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                  {/* Agent Performance */}
                                  <div className="flex flex-col items-center text-center">
                                    <p className="text-xs text-slate-500 mb-1">
                                      Agent Performance
                                    </p>
                                    <span className="text-2xl font-bold text-green-600 mb-1">
                                      {Math.round(
                                        (call.callAnalysis.agentPerformance ||
                                          0) * 100
                                      )}
                                      %
                                    </span>
                                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                                      <div
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${Math.min(
                                            (call.callAnalysis
                                              .agentPerformance || 0) * 100,
                                            100
                                          )}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                  {/* Response Time */}
                                  <div className="flex flex-col items-center text-center">
                                    <p className="text-xs text-slate-500 mb-1">
                                      Avg Response Time
                                    </p>
                                    <span className="text-2xl font-bold text-yellow-600 mb-1">
                                      {call.callAnalysis.metrics
                                        ?.averageResponseTime
                                        ? `${Math.round(
                                            call.callAnalysis.metrics
                                              .averageResponseTime
                                          )}s`
                                        : "N/A"}
                                    </span>
                                    <div className="text-xs text-slate-500 mt-1">
                                      {call.callAnalysis.metrics
                                        ?.averageResponseTime
                                        ? call.callAnalysis.metrics
                                            .averageResponseTime < 3
                                          ? "Excellent"
                                          : call.callAnalysis.metrics
                                              .averageResponseTime < 5
                                          ? "Good"
                                          : "Needs Improvement"
                                        : ""}
                                    </div>
                                  </div>
                                  {/* Questions Asked */}
                                  <div className="flex flex-col items-center text-center">
                                    <p className="text-xs text-slate-500 mb-1">
                                      Questions Asked
                                    </p>
                                    <span className="text-2xl font-bold text-indigo-600 mb-1">
                                      {call.callAnalysis.metrics
                                        ?.questionCount || 0}
                                    </span>
                                    <div className="text-xs text-slate-500 mt-1">
                                      {call.callAnalysis.metrics?.questionCount
                                        ? call.callAnalysis.metrics
                                            .questionCount > 5
                                          ? "Engaging"
                                          : call.callAnalysis.metrics
                                              .questionCount > 2
                                          ? "Good"
                                          : "Could ask more"
                                        : ""}
                                    </div>
                                  </div>
                                </div>

                                {/* Key Topics */}
                                {call.callAnalysis.keyTopics &&
                                  call.callAnalysis.keyTopics.length > 0 && (
                                    <div className="mb-6">
                                      <p className="text-base text-slate-900 font-semibold mb-2">
                                        Key Topics
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {call.callAnalysis.keyTopics.map(
                                          (topic, index) => (
                                            <span
                                              key={index}
                                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                                            >
                                              {topic}
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Insights */}
                                {call.callAnalysis.insights && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {call.callAnalysis.insights.strengths &&
                                      call.callAnalysis.insights.strengths
                                        .length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-green-700 mb-2">
                                            Strengths
                                          </p>
                                          <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside pl-2">
                                            {call.callAnalysis.insights.strengths
                                              .slice(0, 2)
                                              .map((strength, index) => (
                                                <li key={index}>{strength}</li>
                                              ))}
                                          </ul>
                                        </div>
                                      )}

                                    {call.callAnalysis.insights.improvements &&
                                      call.callAnalysis.insights.improvements
                                        .length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-yellow-700 mb-2">
                                            Improvements
                                          </p>
                                          <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside pl-2">
                                            {call.callAnalysis.insights.improvements
                                              .slice(0, 2)
                                              .map((improvement, index) => (
                                                <li key={index}>
                                                  {improvement}
                                                </li>
                                              ))}
                                          </ul>
                                        </div>
                                      )}
                                  </div>
                                )}

                                {/* AI Agent Feedback Section - Compact */}
                                {call.agentFeedback && (
                                  <div className="mt-4">
                                    <button
                                      onClick={() =>
                                        toggleSection(call._id, "agentFeedback")
                                      }
                                      className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <div className="p-1.5 bg-blue-100 rounded-lg">
                                          <Target className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="text-left">
                                          <h6 className="text-sm font-semibold text-blue-900">
                                            AI Agent Feedback & Next Steps
                                          </h6>
                                          <p className="text-xs text-blue-700">
                                            Performance:{" "}
                                            {call.agentFeedback
                                              .performanceScore || "N/A"}
                                            /10
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <div className="text-xs text-blue-600 font-medium">
                                          {isSectionExpanded(
                                            call._id,
                                            "agentFeedback"
                                          )
                                            ? "Hide"
                                            : "View"}
                                        </div>
                                        <div
                                          className={`transform transition-transform duration-200 ${
                                            isSectionExpanded(
                                              call._id,
                                              "agentFeedback"
                                            )
                                              ? "rotate-180"
                                              : ""
                                          }`}
                                        >
                                          <svg
                                            className="w-4 h-4 text-blue-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M19 9l-7 7-7-7"
                                            />
                                          </svg>
                                        </div>
                                      </div>
                                    </button>

                                    {isSectionExpanded(
                                      call._id,
                                      "agentFeedback"
                                    ) && (
                                      <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {/* Performance Score */}
                                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-xs font-medium text-slate-700">
                                                Overall Performance
                                              </span>
                                              <span className="text-sm font-bold text-blue-600">
                                                {call.agentFeedback
                                                  .performanceScore || "N/A"}
                                                /10
                                              </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                              <div
                                                className={`h-2 rounded-full transition-all duration-300 ${
                                                  (call.agentFeedback
                                                    .performanceScore || 0) >= 8
                                                    ? "bg-green-500"
                                                    : (call.agentFeedback
                                                        .performanceScore ||
                                                        0) >= 6
                                                    ? "bg-yellow-500"
                                                    : "bg-red-500"
                                                }`}
                                                style={{
                                                  width: `${
                                                    ((call.agentFeedback
                                                      .performanceScore || 0) /
                                                      10) *
                                                    100
                                                  }%`,
                                                }}
                                              ></div>
                                            </div>
                                            <p className="text-xs text-slate-600 mt-1">
                                              {call.agentFeedback
                                                .overallFeedback ||
                                                "No overall feedback available"}
                                            </p>
                                          </div>

                                          {/* Conversation Quality */}
                                          {call.agentFeedback
                                            .conversationQuality && (
                                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                                              <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-slate-700">
                                                  Conversation Quality
                                                </span>
                                                <span className="text-sm font-bold text-blue-600">
                                                  {call.agentFeedback
                                                    .conversationQuality
                                                    .rating || "N/A"}
                                                  /10
                                                </span>
                                              </div>
                                              <p className="text-xs text-slate-600">
                                                {call.agentFeedback
                                                  .conversationQuality
                                                  .feedback ||
                                                  "No feedback available"}
                                              </p>
                                            </div>
                                          )}
                                        </div>

                                        {/* Strengths and Improvements */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                          {/* Strengths */}
                                          {call.agentFeedback.strengths &&
                                            call.agentFeedback.strengths
                                              .length > 0 && (
                                              <div className="bg-white rounded-lg p-3 border border-green-100">
                                                <div className="flex items-center space-x-2 mb-2">
                                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                  <span className="text-xs font-semibold text-green-700">
                                                    Strengths
                                                  </span>
                                                </div>
                                                <ul className="text-xs text-slate-700 space-y-1">
                                                  {call.agentFeedback.strengths.map(
                                                    (
                                                      strength: string,
                                                      index: number
                                                    ) => (
                                                      <li
                                                        key={index}
                                                        className="flex items-start space-x-2"
                                                      >
                                                        <span className="text-green-500 mt-1">
                                                          •
                                                        </span>
                                                        <span>{strength}</span>
                                                      </li>
                                                    )
                                                  )}
                                                </ul>
                                              </div>
                                            )}

                                          {/* Improvements */}
                                          {call.agentFeedback.improvements &&
                                            call.agentFeedback.improvements
                                              .length > 0 && (
                                              <div className="bg-white rounded-lg p-3 border border-yellow-100">
                                                <div className="flex items-center space-x-2 mb-2">
                                                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                                  <span className="text-xs font-semibold text-yellow-700">
                                                    Areas for Improvement
                                                  </span>
                                                </div>
                                                <ul className="text-xs text-slate-700 space-y-1">
                                                  {call.agentFeedback.improvements.map(
                                                    (
                                                      improvement: string,
                                                      index: number
                                                    ) => (
                                                      <li
                                                        key={index}
                                                        className="flex items-start space-x-2"
                                                      >
                                                        <span className="text-yellow-500 mt-1">
                                                          •
                                                        </span>
                                                        <span>
                                                          {improvement}
                                                        </span>
                                                      </li>
                                                    )
                                                  )}
                                                </ul>
                                              </div>
                                            )}
                                        </div>

                                        {/* Sales Techniques & Customer Handling */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                          {/* Sales Techniques */}
                                          {call.agentFeedback
                                            .salesTechniques && (
                                            <div className="bg-white rounded-lg p-3 border border-purple-100">
                                              <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-purple-700">
                                                  Sales Techniques
                                                </span>
                                                <span className="text-xs font-bold text-purple-600">
                                                  {call.agentFeedback
                                                    .salesTechniques.rating ||
                                                    "N/A"}
                                                  /10
                                                </span>
                                              </div>
                                              <p className="text-xs text-slate-600 mb-2">
                                                {call.agentFeedback
                                                  .salesTechniques.feedback ||
                                                  "No feedback available"}
                                              </p>
                                              {call.agentFeedback
                                                .salesTechniques.suggestions &&
                                                call.agentFeedback
                                                  .salesTechniques.suggestions
                                                  .length > 0 && (
                                                  <div>
                                                    <span className="text-xs font-medium text-slate-700">
                                                      Suggestions:
                                                    </span>
                                                    <ul className="text-xs text-slate-600 mt-1 space-y-1">
                                                      {call.agentFeedback.salesTechniques.suggestions.map(
                                                        (
                                                          suggestion: string,
                                                          index: number
                                                        ) => (
                                                          <li
                                                            key={index}
                                                            className="flex items-start space-x-2"
                                                          >
                                                            <span className="text-purple-500 mt-1">
                                                              •
                                                            </span>
                                                            <span>
                                                              {suggestion}
                                                            </span>
                                                          </li>
                                                        )
                                                      )}
                                                    </ul>
                                                  </div>
                                                )}
                                            </div>
                                          )}

                                          {/* Customer Handling */}
                                          {call.agentFeedback
                                            .customerHandling && (
                                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                                              <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-blue-700">
                                                  Customer Handling
                                                </span>
                                                <span className="text-xs font-bold text-blue-600">
                                                  {call.agentFeedback
                                                    .customerHandling.rating ||
                                                    "N/A"}
                                                  /10
                                                </span>
                                              </div>
                                              <p className="text-xs text-slate-600 mb-2">
                                                {call.agentFeedback
                                                  .customerHandling.feedback ||
                                                  "No feedback available"}
                                              </p>
                                              {call.agentFeedback
                                                .customerHandling.suggestions &&
                                                call.agentFeedback
                                                  .customerHandling.suggestions
                                                  .length > 0 && (
                                                  <div>
                                                    <span className="text-xs font-medium text-slate-700">
                                                      Suggestions:
                                                    </span>
                                                    <ul className="text-xs text-slate-600 mt-1 space-y-1">
                                                      {call.agentFeedback.customerHandling.suggestions.map(
                                                        (
                                                          suggestion: string,
                                                          index: number
                                                        ) => (
                                                          <li
                                                            key={index}
                                                            className="flex items-start space-x-2"
                                                          >
                                                            <span className="text-blue-500 mt-1">
                                                              •
                                                            </span>
                                                            <span>
                                                              {suggestion}
                                                            </span>
                                                          </li>
                                                        )
                                                      )}
                                                    </ul>
                                                  </div>
                                                )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Next Steps */}
                                        {call.agentFeedback.nextSteps &&
                                          call.agentFeedback.nextSteps.length >
                                            0 && (
                                            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                              <div className="flex items-start space-x-2">
                                                <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                  <p className="text-xs font-medium text-slate-700 mb-1">
                                                    Next Steps for Future Calls:
                                                  </p>
                                                  <ul className="text-xs text-slate-600 space-y-1">
                                                    {call.agentFeedback.nextSteps.map(
                                                      (
                                                        step: string,
                                                        index: number
                                                      ) => (
                                                        <li
                                                          key={index}
                                                          className="flex items-start space-x-2"
                                                        >
                                                          <span className="text-yellow-500 mt-1">
                                                            •
                                                          </span>
                                                          <span>{step}</span>
                                                        </li>
                                                      )
                                                    )}
                                                  </ul>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Call Summary Section - Compact */}
                                {call.callSummary && (
                                  <div className="mt-4">
                                    <button
                                      onClick={() =>
                                        toggleSection(call._id, "callSummary")
                                      }
                                      className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 hover:from-indigo-100 hover:to-purple-100 transition-all duration-200"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                                          <MessageSquare className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div className="text-left">
                                          <h6 className="text-sm font-semibold text-indigo-900">
                                            Call Summary
                                          </h6>
                                          <p className="text-xs text-indigo-700">
                                            {call.callSummary.overallAssessment?.substring(
                                              0,
                                              60
                                            )}
                                            ...
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <div className="text-xs text-indigo-600 font-medium">
                                          {isSectionExpanded(
                                            call._id,
                                            "callSummary"
                                          )
                                            ? "Hide"
                                            : "View"}
                                        </div>
                                        <div
                                          className={`transform transition-transform duration-200 ${
                                            isSectionExpanded(
                                              call._id,
                                              "callSummary"
                                            )
                                              ? "rotate-180"
                                              : ""
                                          }`}
                                        >
                                          <svg
                                            className="w-4 h-4 text-indigo-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M19 9l-7 7-7-7"
                                            />
                                          </svg>
                                        </div>
                                      </div>
                                    </button>

                                    {isSectionExpanded(
                                      call._id,
                                      "callSummary"
                                    ) && (
                                      <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
                                        <div className="space-y-4">
                                          {/* Overall Assessment */}
                                          <div className="bg-white rounded-lg p-3 border border-indigo-100">
                                            <div className="flex items-start space-x-2">
                                              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2"></div>
                                              <div>
                                                <p className="text-xs font-semibold text-indigo-700 mb-1">
                                                  Overall Assessment
                                                </p>
                                                <p className="text-sm text-slate-700">
                                                  {
                                                    call.callSummary
                                                      .overallAssessment
                                                  }
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Customer Tone */}
                                          <div className="bg-white rounded-lg p-3 border border-indigo-100">
                                            <div className="flex items-start space-x-2">
                                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                                              <div>
                                                <p className="text-xs font-semibold text-blue-700 mb-1">
                                                  Customer Tone
                                                </p>
                                                <p className="text-sm text-slate-700">
                                                  {
                                                    call.callSummary
                                                      .customerTone
                                                  }
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Conversion Attempt */}
                                          <div className="bg-white rounded-lg p-3 border border-indigo-100">
                                            <div className="flex items-start space-x-2">
                                              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                                              <div>
                                                <p className="text-xs font-semibold text-purple-700 mb-1">
                                                  Conversion Attempt
                                                </p>
                                                <p className="text-sm text-slate-700">
                                                  {
                                                    call.callSummary
                                                      .conversionAttempt
                                                  }
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Key Outcomes */}
                                          {call.callSummary.keyOutcomes &&
                                            call.callSummary.keyOutcomes
                                              .length > 0 && (
                                              <div className="bg-white rounded-lg p-3 border border-indigo-100">
                                                <div className="flex items-start space-x-2">
                                                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                                                  <div>
                                                    <p className="text-xs font-semibold text-green-700 mb-1">
                                                      Key Outcomes
                                                    </p>
                                                    <ul className="text-sm text-slate-700 space-y-1">
                                                      {call.callSummary.keyOutcomes.map(
                                                        (
                                                          outcome: string,
                                                          index: number
                                                        ) => (
                                                          <li
                                                            key={index}
                                                            className="flex items-start space-x-2"
                                                          >
                                                            <span className="text-green-500 mt-1">
                                                              •
                                                            </span>
                                                            <span>
                                                              {outcome}
                                                            </span>
                                                          </li>
                                                        )
                                                      )}
                                                    </ul>
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                          {/* Next Call Strategy */}
                                          <div className="bg-white rounded-lg p-3 border border-indigo-100">
                                            <div className="flex items-start space-x-2">
                                              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                                              <div>
                                                <p className="text-xs font-semibold text-yellow-700 mb-1">
                                                  Next Call Strategy
                                                </p>
                                                <p className="text-sm text-slate-700">
                                                  {
                                                    call.callSummary
                                                      .nextCallStrategy
                                                  }
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transcript Modal */}
      {isTranscriptModalOpen && selectedTranscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">
                Full Call Transcript
              </h3>
              <button
                onClick={closeTranscriptModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {(() => {
                  // Parse the transcript into speaker segments
                  const segments =
                    selectedTranscript?.match(
                      /\[(Customer|Agent)\]:\s*([^[]*)/g
                    ) || [];

                  return segments.map((segment, index) => {
                    const match = segment.match(/\[(Customer|Agent)\]:\s*(.*)/);
                    if (!match) return null;

                    const speaker = match[1];
                    const text = match[2].trim();
                    const isCustomer = speaker === "Customer";

                    if (!text) return null;

                    return (
                      <div
                        key={index}
                        className={`flex ${
                          isCustomer ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] p-4 rounded-xl ${
                            isCustomer
                              ? "bg-blue-50 border-l-4 border-blue-400"
                              : "bg-green-50 border-l-4 border-green-400"
                          }`}
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <span
                              className={`text-sm font-semibold ${
                                isCustomer ? "text-blue-700" : "text-green-700"
                              }`}
                            >
                              {speaker}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-slate-800 leading-relaxed">
                            {text}
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  onClick={closeTranscriptModal}
                  className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions Modal */}
      {isSuggestionsModalOpen && selectedSuggestions.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Lightbulb className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    AI Suggestions
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedSuggestions.length} suggestions generated
                  </p>
                </div>
              </div>
              <button
                onClick={closeSuggestionsModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-6 hover:shadow-lg transition-all duration-200"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          {getSuggestionIcon(suggestion.type)}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                            {suggestion.type.replace("_", " ").toUpperCase()}
                          </span>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-slate-500">
                              {(suggestion.confidence * 100).toFixed(0)}%
                              confidence
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border">
                          {suggestion.deliver_as}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <p className="text-slate-800 leading-relaxed mb-3">
                        {suggestion.text}
                      </p>
                      {suggestion.reasoning && (
                        <div className="bg-white/60 p-3 rounded-lg border border-purple-100">
                          <div className="flex items-start space-x-2">
                            <Brain className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-purple-700 mb-1">
                                AI Reasoning:
                              </p>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {suggestion.reasoning}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-purple-100">
                      <span className="text-xs text-slate-400 font-mono">
                        {suggestion.offer_id}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button className="text-xs text-purple-600 hover:text-purple-700 flex items-center space-x-1">
                          <ExternalLink className="w-3 h-3" />
                          <span>Use Suggestion</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-500">
                  Generated by AI • {selectedSuggestions.length} suggestions
                </div>
                <button
                  onClick={closeSuggestionsModal}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
