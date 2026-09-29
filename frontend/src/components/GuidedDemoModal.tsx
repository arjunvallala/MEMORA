import React, { useState } from 'react';
import { Play, X, CheckCircle2, ArrowRight, Brain, Sparkles, Layers } from 'lucide-react';
import { sendChatMessage, askTeamMemory, resetDemoWorkspace } from '../api/client';

interface GuidedDemoModalProps {
  projectId: string;
  onClose: () => void;
  onRefreshWorkspace: () => void;
}

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({ projectId, onClose, onRefreshWorkspace }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isRunningStep, setIsRunningStep] = useState<boolean>(false);
  const [stepOutput, setStepOutput] = useState<string>('');

  const steps = [
    {
      num: 1,
      title: 'STEP 1: Groq Stores Decision in Hindsight',
      agent: 'Groq (Architect)',
      prompt: 'We are building a payment platform. For transactional data, we decided to use PostgreSQL because strong consistency is important. Remember this architectural decision.',
      operation: 'RETAIN',
      desc: 'Groq processes the architectural decision and calls Hindsight RETAIN to store it in shared project bank.'
    },
    {
      num: 2,
      title: 'STEP 2: Gemini Recalls Groq\'s Memory',
      agent: 'Gemini (Researcher)',
      prompt: 'What database should we use for the transactional part of this project?',
      operation: 'RECALL',
      desc: 'Gemini has NO message history from Groq. Gemini calls Hindsight RECALL, discovers the PostgreSQL decision, and uses it to answer.'
    },
    {
      num: 3,
      title: 'STEP 3: Gemini Stores Technical Failure Lesson',
      agent: 'Gemini (Researcher)',
      prompt: 'We also tried Redis for this endpoint and it caused timeout issues under load. Remember that we should avoid that approach here.',
      operation: 'RETAIN',
      desc: 'Gemini identifies a critical engineering lesson and retains it in Hindsight.'
    },
    {
      num: 4,
      title: 'STEP 4: GPT Recalls Gemini\'s Lesson',
      agent: 'GPT (Reviewer)',
      prompt: 'What caching approach should we avoid for endpoint X?',
      operation: 'RECALL',
      desc: 'GPT has NO previous chat history from Gemini. GPT calls Hindsight RECALL and warns against Redis caching based on Gemini\'s retained lesson.'
    },
    {
      num: 5,
      title: 'STEP 5: Team Memory Reflection (Hindsight REFLECT)',
      agent: 'Hindsight Memory Engine',
      prompt: 'What has the team learned about the architecture so far?',
      operation: 'REFLECT',
      desc: 'Hindsight REFLECT performs agentic reasoning across stored memories, synthesizing a comprehensive architectural summary.'
    }
  ];

  const handleExecuteStep = async (stepNum: number) => {
    setIsRunningStep(true);
    setStepOutput('Executing backend operation & Hindsight memory call...');

    try {
      if (stepNum === 1) {
        const res = await sendChatMessage(projectId, 'groq', steps[0].prompt);
        setStepOutput(`GROQ RESPONSE:\n${res.content}\n\n[HINDSIGHT RETAIN]: Stored "${res.retainedMemory?.content || 'PostgreSQL decision'}"`);
      } else if (stepNum === 2) {
        const res = await sendChatMessage(projectId, 'gemini', steps[1].prompt);
        setStepOutput(`GEMINI RESPONSE:\n${res.content}\n\n[HINDSIGHT RECALL]: Recalled ${res.recalledMemories?.length || 1} memory retained by Groq.`);
      } else if (stepNum === 3) {
        const res = await sendChatMessage(projectId, 'gemini', steps[2].prompt);
        setStepOutput(`GEMINI RESPONSE:\n${res.content}\n\n[HINDSIGHT RETAIN]: Stored "${res.retainedMemory?.content || 'Redis timeout lesson'}"`);
      } else if (stepNum === 4) {
        const res = await sendChatMessage(projectId, 'gpt', steps[3].prompt);
        setStepOutput(`GPT RESPONSE:\n${res.content}\n\n[HINDSIGHT RECALL]: Recalled ${res.recalledMemories?.length || 1} memory retained by Gemini.`);
      } else if (stepNum === 5) {
        const res = await askTeamMemory(projectId, steps[4].prompt);
        setStepOutput(`HINDSIGHT REFLECT SYNTHESIS:\n${res.answer}\n\nSupporting Memories: ${res.supportingMemories.length}`);
      }

      onRefreshWorkspace();
      if (stepNum < 5) {
        setCurrentStep(stepNum + 1);
      }
    } catch (err: any) {
      setStepOutput('Error: ' + err.message);
    } finally {
      setIsRunningStep(false);
    }
  };

  const handleReset = async () => {
    await resetDemoWorkspace();
    setCurrentStep(1);
    setStepOutput('Workspace reset. Ready for step 1.');
    onRefreshWorkspace();
  };

  const activeStep = steps.find((s) => s.num === currentStep)!;

  return (
    <div className="fixed inset-0 bg-ink-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-paper-50 border border-paper-300 rounded-lg p-6 max-w-2xl w-full shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-paper-300 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-100 text-amber-900 rounded">
              <Play size={20} />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-ink-900 leading-none">HACKATHON GUIDED DEMO</h3>
              <p className="text-xs text-ink-500 mt-0.5">
                Automated 60-second walkthrough proving cross-agent persistent memory.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-ink-400 hover:text-ink-900 rounded">
            <X size={18} />
          </button>
        </div>

        {/* Steps Progress Pills */}
        <div className="grid grid-cols-5 gap-1.5 text-xs font-bold font-mono">
          {steps.map((s) => (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`p-2 rounded text-center border transition ${
                currentStep === s.num
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : currentStep > s.num
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-paper-100 text-ink-500 border-paper-300'
              }`}
            >
              Step {s.num}
            </button>
          ))}
        </div>

        {/* Step Card Info */}
        <div className="bg-paper-100 p-4 rounded-lg border border-paper-300 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-heading text-lg font-bold text-ink-900">{activeStep.title}</h4>
            <span className="text-xs uppercase font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
              {activeStep.operation}
            </span>
          </div>

          <p className="text-xs text-ink-600 font-medium">{activeStep.desc}</p>

          <div className="p-3 bg-white border border-paper-300 rounded font-mono text-xs text-ink-900">
            <span className="text-ink-400 font-bold block mb-1">Target Agent: {activeStep.agent}</span>
            <span className="text-ink-800">Prompt: "{activeStep.prompt}"</span>
          </div>
        </div>

        {/* Output Log Box */}
        {stepOutput && (
          <div className="p-3 bg-ink-900 text-paper-50 rounded font-mono text-xs space-y-1 max-h-36 overflow-y-auto whitespace-pre-wrap">
            {stepOutput}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded"
          >
            Reset Demo State
          </button>

          <div className="flex space-x-2">
            <button
              onClick={() => handleExecuteStep(currentStep)}
              disabled={isRunningStep}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded shadow-xs flex items-center space-x-2 disabled:opacity-50"
            >
              {isRunningStep ? (
                <span>Processing Step {currentStep}...</span>
              ) : (
                <>
                  <span>Run Step {currentStep}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
