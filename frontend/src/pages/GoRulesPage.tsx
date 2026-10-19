import React, { useState, useEffect, useRef } from 'react';
import { gorulesApi } from '../api/client';
import {
  Cpu,
  Upload,
  Play,
  Plus,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  FileJson,
  ChevronRight,
  Code2,
} from 'lucide-react';
import { Modal } from '../components/Modal';

interface GoRule {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export const GoRulesPage: React.FC = () => {
  const [rules, setRules] = useState<GoRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [ruleFile, setRuleFile] = useState<File | null>(null);
  const [dictFile, setDictFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const ruleFileRef = useRef<HTMLInputElement>(null);
  const dictFileRef = useRef<HTMLInputElement>(null);

  // Evaluate modal
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<string>('');
  const [evalContextStr, setEvalContextStr] = useState('{\n  "investmentAmount": 500000\n}');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const data = await gorulesApi.getAll();
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load GoRules:', err);
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim() || !ruleFile || !dictFile) {
      setMessage({ type: 'error', text: 'Rule name, decision JSON, and dictionary JSON are all required.' });
      return;
    }
    setIsUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('name', uploadName.trim());
      formData.append('ruleFile', ruleFile);
      formData.append('dictionaryFile', dictFile);
      await gorulesApi.upload(formData);
      setMessage({ type: 'success', text: `Rule "${uploadName}" uploaded successfully!` });
      setIsUploadModalOpen(false);
      setUploadName('');
      setRuleFile(null);
      setDictFile(null);
      loadRules();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to upload GoRules decision file.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvalError(null);
    setEvalResult(null);

    let context: Record<string, any>;
    try {
      context = JSON.parse(evalContextStr);
    } catch {
      setEvalError('Invalid JSON in context. Please fix the JSON syntax.');
      return;
    }

    setIsEvaluating(true);
    try {
      const result = await gorulesApi.evaluate(selectedRule, context);
      setEvalResult(result);
    } catch (err: any) {
      setEvalError(err?.response?.data?.message || 'Evaluation failed. Check rule name and context.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const openEvalModal = (ruleName: string) => {
    setSelectedRule(ruleName);
    setEvalResult(null);
    setEvalError(null);
    setEvalContextStr('{\n  "investmentAmount": 500000\n}');
    setIsEvalModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">GoRules Decision Engine</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Upload decision tables and evaluate investment risk rules in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadRules}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-950/50 transition-all transform hover:-translate-y-0.5"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Rule</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-sm flex items-center gap-3 border ${
            message.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/70 border-rose-800 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Rules Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading GoRules decision tables...</span>
        </div>
      ) : rules.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl">
          <Cpu className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="font-bold text-slate-200 text-base">No decision rules uploaded yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Upload a GoRules JSON decision table and dictionary to start risk-evaluating investment requests.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Upload First Rule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center flex-shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">{rule.name}</h3>
                    <span className="text-[11px] font-mono text-slate-400">ID: {rule.id?.slice(0, 8)}...</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  {rule.createdAt && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Uploaded:</span>
                      <span className="text-slate-300">{new Date(rule.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/60">
                <button
                  onClick={() => openEvalModal(rule.name)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold border border-indigo-500/30 hover:border-transparent transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Evaluate Rule</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Rule Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload GoRules Decision Table"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-xs text-indigo-300 flex items-start gap-2.5">
            <FileJson className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              Upload a <strong>GoRules JSON decision table</strong> and its <strong>dictionary file</strong>.
              The rule name is used later to evaluate investment requests.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Rule Name (used to reference this rule)
            </label>
            <input
              type="text"
              required
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="e.g. investment-approval"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Decision JSON File (ruleFile)
            </label>
            <div
              onClick={() => ruleFileRef.current?.click()}
              className="w-full px-3.5 py-3 bg-slate-950 border border-dashed border-slate-700 rounded-xl text-sm cursor-pointer hover:border-emerald-500 transition-colors flex items-center gap-3"
            >
              <FileJson className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className={ruleFile ? 'text-slate-200' : 'text-slate-400'}>
                {ruleFile ? ruleFile.name : 'Click to select decision JSON file...'}
              </span>
            </div>
            <input
              ref={ruleFileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => setRuleFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Dictionary JSON File (dictionaryFile)
            </label>
            <div
              onClick={() => dictFileRef.current?.click()}
              className="w-full px-3.5 py-3 bg-slate-950 border border-dashed border-slate-700 rounded-xl text-sm cursor-pointer hover:border-emerald-500 transition-colors flex items-center gap-3"
            >
              <FileJson className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className={dictFile ? 'text-slate-200' : 'text-slate-400'}>
                {dictFile ? dictFile.name : 'Click to select dictionary JSON file...'}
              </span>
            </div>
            <input
              ref={dictFileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => setDictFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload Rule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Evaluate Rule Modal */}
      <Modal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        title={`Evaluate Rule: ${selectedRule}`}
      >
        <form onSubmit={handleEvaluate} className="space-y-4">
          <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-xs text-indigo-300 flex items-start gap-2.5">
            <Code2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              Provide a JSON context object to evaluate against the <strong>{selectedRule}</strong> decision table.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Context (JSON)
            </label>
            <textarea
              rows={6}
              value={evalContextStr}
              onChange={(e) => setEvalContextStr(e.target.value)}
              placeholder='{ "investmentAmount": 500000 }'
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {evalError && (
            <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              {evalError}
            </div>
          )}

          {evalResult !== null && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/40 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>Evaluation Result</span>
              </div>
              <pre className="text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap font-mono">
                {JSON.stringify(evalResult, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEvalModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isEvaluating}
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isEvaluating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Evaluation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

