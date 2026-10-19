import React, { useState, useEffect, useRef } from 'react';
import { jasperApi } from '../api/client';
import {
  FileText,
  Upload,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileOutput,
  File,
} from 'lucide-react';
import { Modal } from '../components/Modal';

interface JasperTemplate {
  id: string;
  name: string;
  description?: string;
  fileName?: string;
  createdAt?: string;
  updatedAt?: string;
}

const REPORT_FORMATS = ['pdf', 'xlsx', 'docx', 'html'] as const;
type ReportFormat = typeof REPORT_FORMATS[number];

export const JasperPage: React.FC = () => {
  const [templates, setTemplates] = useState<JasperTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload template modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [jrxmlFile, setJrxmlFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Generate report modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf');
  const [reportParamsStr, setReportParamsStr] = useState('{\n  "title": "Investment Report"\n}');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await jasperApi.listTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load Jasper templates:', err);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || !jrxmlFile) {
      setMessage({ type: 'error', text: 'Template name and JRXML file are required.' });
      return;
    }
    setIsUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('name', templateName.trim());
      if (templateDesc) formData.append('description', templateDesc.trim());
      formData.append('file', jrxmlFile);
      await jasperApi.uploadTemplate(formData);
      setMessage({ type: 'success', text: `Template "${templateName}" uploaded successfully!` });
      setIsUploadModalOpen(false);
      setTemplateName('');
      setTemplateDesc('');
      setJrxmlFile(null);
      loadTemplates();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to upload Jasper template.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const openGenerateModal = (name: string) => {
    setSelectedTemplate(name);
    setReportFormat('pdf');
    setReportParamsStr('{\n  "title": "Investment Report"\n}');
    setGenerateError(null);
    setIsGenerateModalOpen(true);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerateError(null);

    let params: Record<string, any> = {};
    try {
      if (reportParamsStr.trim()) {
        params = JSON.parse(reportParamsStr);
      }
    } catch {
      setGenerateError('Invalid JSON in parameters. Please fix the syntax.');
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await jasperApi.generate({
        templateName: selectedTemplate,
        format: reportFormat,
        parameters: params,
      });
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTemplate}.${reportFormat}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setIsGenerateModalOpen(false);
      setMessage({ type: 'success', text: `Report "${selectedTemplate}.${reportFormat}" downloaded!` });
    } catch (err: any) {
      setGenerateError(err?.response?.data?.message || 'Failed to generate report. Check Jasper connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatIcon: Record<ReportFormat, string> = {
    pdf: '📄',
    xlsx: '📊',
    docx: '📝',
    html: '🌐',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Jasper Report Templates</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage JRXML report templates and generate PDF / Excel / Word reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadTemplates}
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
            <span>Upload Template</span>
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

      {/* Templates Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading report templates...</span>
        </div>
      ) : templates.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl">
          <FileText className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="font-bold text-slate-200 text-base">No report templates uploaded yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Upload a Jasper JRXML template to generate PDF, Excel, Word, or HTML investment reports.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Upload First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">{tpl.name}</h3>
                    {tpl.fileName && (
                      <span className="text-[11px] font-mono text-slate-400">{tpl.fileName}</span>
                    )}
                  </div>
                </div>

                {tpl.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {REPORT_FORMATS.map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase"
                    >
                      {formatIcon[fmt]} {fmt}
                    </span>
                  ))}
                </div>

                {tpl.createdAt && (
                  <div className="mt-3 text-[11px] text-slate-500">
                    Uploaded: {new Date(tpl.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/60">
                <button
                  onClick={() => openGenerateModal(tpl.name)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-xl text-xs font-semibold border border-amber-500/30 hover:border-transparent transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Generate Report</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Template Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Jasper Report Template"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
            <File className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              Upload a <strong>JRXML</strong> Jasper report template. This will be compiled and
              stored for generating PDF, Excel, Word, and HTML reports.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Template Name
            </label>
            <input
              type="text"
              required
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. investment-summary"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              value={templateDesc}
              onChange={(e) => setTemplateDesc(e.target.value)}
              placeholder="Brief description of report contents..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              JRXML File
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full px-3.5 py-3 bg-slate-950 border border-dashed border-slate-700 rounded-xl text-sm cursor-pointer hover:border-emerald-500 transition-colors flex items-center gap-3"
            >
              <FileOutput className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className={jrxmlFile ? 'text-slate-200' : 'text-slate-400'}>
                {jrxmlFile ? jrxmlFile.name : 'Click to select .jrxml file...'}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".jrxml,.xml"
              className="hidden"
              onChange={(e) => setJrxmlFile(e.target.files?.[0] ?? null)}
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
                  <span>Upload Template</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Generate Report Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title={`Generate Report: ${selectedTemplate}`}
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
              Output Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {REPORT_FORMATS.map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setReportFormat(fmt)}
                  className={`py-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                    reportFormat === fmt
                      ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-lg mb-0.5">{formatIcon[fmt]}</div>
                  <div className="uppercase">{fmt}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Report Parameters (JSON, optional)
            </label>
            <textarea
              rows={5}
              value={reportParamsStr}
              onChange={(e) => setReportParamsStr(e.target.value)}
              placeholder='{ "investmentId": "...", "title": "..." }'
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          {generateError && (
            <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              {generateError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate & Download</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

