import React, { useState, useEffect, useRef } from 'react';
import {
  fetchLessonResources,
  uploadLessonResources,
  updateResourceMetadata,
  replaceResourceFile,
  deleteResource,
  getResourceDownloadUrl,
  getResourcePreviewUrl,
} from '../services/api';
import {
  X,
  Upload,
  FileText,
  FileCode,
  Image as ImageIcon,
  Film,
  Download,
  Eye,
  Trash2,
  Edit2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileUp,
  FolderOpen,
  Info,
  ExternalLink,
  Save,
} from 'lucide-react';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.webp', '.txt'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const LessonResourcesModal = ({ lesson, onClose, onUpdated }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Upload State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Edit Metadata State
  const [editingResource, setEditingResource] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [updatingMetadata, setUpdatingMetadata] = useState(false);

  // Replace File State
  const [replacingResourceId, setReplacingResourceId] = useState(null);
  const replaceInputRef = useRef(null);
  const [replaceLoading, setReplaceLoading] = useState(false);

  // Delete State
  const [deletingResource, setDeletingResource] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadResources = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchLessonResources(lesson._id);
      setResources(data || []);
    } catch (err) {
      console.error('Failed to load resources:', err);
      setError(err.response?.data?.message || 'Failed to load resources for this lesson.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lesson?._id) {
      loadResources();
    }
  }, [lesson?._id]);

  // Frontend File Validation
  const validateFiles = (files) => {
    if (!files || files.length === 0) {
      return 'Please select a file to upload.';
    }
    if (files.length > MAX_FILES) {
      return `You can upload a maximum of ${MAX_FILES} files per request.`;
    }

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return 'This file format is not supported. Upload a PDF, DOCX, PPTX, JPG, PNG, WEBP, or TXT file.';
      }
      if (file.size > MAX_FILE_SIZE) {
        return `The selected file "${file.name}" exceeds the 10 MB size limit.`;
      }
      if (file.size === 0) {
        return `The selected file "${file.name}" appears to be invalid or corrupted (0 bytes).`;
      }
    }
    return null;
  };

  const handleFileSelection = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      setSelectedFiles([]);
      return;
    }

    setError('');
    setSelectedFiles(files);
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      setSelectedFiles([]);
      return;
    }

    setError('');
    setSelectedFiles(files);
  };

  // Upload Submission
  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Please select a file to upload.');
      return;
    }

    const validationError = validateFiles(selectedFiles);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');
      setUploadProgress(10);

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const res = await uploadLessonResources(lesson._id, formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      setSuccess(res.message || 'The file was uploaded successfully.');
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadResources();
      if (onUpdated) onUpdated();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(
        err.response?.data?.message || 'The file upload failed. Check your connection and try again.'
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Edit Metadata
  const openEditModal = (resource) => {
    setEditingResource(resource);
    setEditForm({
      title: resource.title || '',
      description: resource.description || '',
    });
    setError('');
  };

  const handleSaveMetadata = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      setError('Resource title is required.');
      return;
    }

    try {
      setUpdatingMetadata(true);
      setError('');
      await updateResourceMetadata(editingResource._id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
      });
      setSuccess('Resource metadata updated successfully.');
      setEditingResource(null);
      loadResources();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update resource metadata.');
    } finally {
      setUpdatingMetadata(false);
    }
  };

  // Replace File
  const triggerReplaceFile = (resourceId) => {
    setReplacingResourceId(resourceId);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = '';
      replaceInputRef.current.click();
    }
  };

  const handleReplaceFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !replacingResourceId) return;

    const validationError = validateFiles([file]);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setReplaceLoading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('file', file);

      await replaceResourceFile(replacingResourceId, formData);
      setSuccess('The file was uploaded successfully.');
      loadResources();
      if (onUpdated) onUpdated();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'The file upload failed. Check your connection and try again.');
    } finally {
      setReplaceLoading(false);
      setReplacingResourceId(null);
    }
  };

  // Delete Resource
  const handleDeleteResource = async () => {
    if (!deletingResource) return;
    try {
      setDeleteLoading(true);
      setError('');
      await deleteResource(deletingResource._id);
      setSuccess('Resource deleted successfully.');
      setDeletingResource(null);
      loadResources();
      if (onUpdated) onUpdated();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'The resource could not be deleted. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'PDF':
        return <FileCode className="w-4 h-4 text-rose-600" />;
      case 'Image':
        return <ImageIcon className="w-4 h-4 text-emerald-600" />;
      case 'Video':
        return <Film className="w-4 h-4 text-indigo-600" />;
      case 'Document':
      case 'Presentation':
      case 'Text':
      default:
        return <FileText className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'PDF':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Image':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Presentation':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Document':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const canPreview = (type) => ['PDF', 'Image', 'Text'].includes(type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                Lesson Resources
              </span>
              <span className="text-xs text-slate-400">Order {lesson.order}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 line-clamp-1">{lesson.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs shrink-0 shadow-xs">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-xs shrink-0 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 text-[11px] underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Hidden File Input for Replace Action */}
        <input
          type="file"
          ref={replaceInputRef}
          onChange={handleReplaceFileChange}
          accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt"
          className="hidden"
        />

        <div className="overflow-y-auto space-y-5 flex-1 pr-1">
          {/* Upload Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                : 'border-slate-200 hover:border-indigo-300 bg-slate-50/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelection}
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt"
              className="hidden"
              id="lesson-file-upload-input"
            />

            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Drag and drop files here, or{' '}
                  <label
                    htmlFor="lesson-file-upload-input"
                    className="text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                  >
                    browse files
                  </label>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Accepted: PDF, DOCX, PPTX, JPG, PNG, WEBP, TXT • Max 10 MB per file • Up to 5 files
                </p>
              </div>
            </div>

            {/* Selected files preview */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <span>Selected files ({selectedFiles.length}):</span>
                  <button
                    onClick={() => {
                      setSelectedFiles([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-slate-400 hover:text-rose-600 text-[11px]"
                  >
                    Clear selection
                  </button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {selectedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800"
                    >
                      <span className="truncate max-w-[340px] font-medium">{f.name}</span>
                      <span className="text-[11px] text-slate-400 ml-2">{formatFileSize(f.size)}</span>
                    </div>
                  ))}
                </div>

                {/* Upload Progress Bar */}
                {uploading && uploadProgress > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>Uploading files safely...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" /> Upload {selectedFiles.length} Resource{selectedFiles.length > 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Resources List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-indigo-600" />
                Attached Learning Resources ({resources.length})
              </h3>
              <button
                onClick={loadResources}
                disabled={loading}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Refresh resources list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Loading lesson files...</p>
              </div>
            ) : resources.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <p className="text-xs font-bold text-slate-700">No resources attached</p>
                <p className="text-[11px] text-slate-400">
                  Upload lesson handouts, slide presentations, PDFs, or code samples above.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {resources.map((res) => {
                  const hasPhysicalFile = Boolean(res.storagePath || res.storedFilename);
                  const isReplacingThis = replaceLoading && replacingResourceId === res._id;

                  return (
                    <div
                      key={res._id}
                      className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-indigo-200 bg-white hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 shrink-0 mt-0.5">
                          {getTypeIcon(res.type)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 truncate max-w-[280px]">
                              {res.title}
                            </h4>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getTypeBadge(
                                res.type
                              )}`}
                            >
                              {res.type}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                            {res.originalFilename && (
                              <span className="truncate max-w-[180px] font-mono text-[10px] text-slate-500">
                                {res.originalFilename}
                              </span>
                            )}
                            {res.fileSizeBytes > 0 && <span>• {formatFileSize(res.fileSizeBytes)}</span>}
                            <span>• {new Date(res.createdAt).toLocaleDateString()}</span>
                          </div>

                          {res.description && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{res.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Resource Actions */}
                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                        {/* Preview Action (if PDF, image, text) */}
                        {hasPhysicalFile && canPreview(res.type) && (
                          <a
                            href={getResourcePreviewUrl(res._id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Preview Resource"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Download Action */}
                        <a
                          href={hasPhysicalFile ? getResourceDownloadUrl(res._id) : res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={res.originalFilename || undefined}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Download Resource"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {/* Replace File Action */}
                        {hasPhysicalFile && (
                          <button
                            onClick={() => triggerReplaceFile(res._id)}
                            disabled={isReplacingThis}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Replace File"
                          >
                            {isReplacingThis ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {/* Edit Metadata */}
                        <button
                          onClick={() => openEditModal(res)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Metadata"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Resource */}
                        <button
                          onClick={() => setDeletingResource(res)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Resource"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Uploads are scanned and stored outside web root
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Edit Metadata Sub-Modal */}
      {editingResource && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Edit Resource Metadata</h3>
              <button
                onClick={() => setEditingResource(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMetadata} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Resource Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Additional context or reading notes..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingResource(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingMetadata}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors disabled:opacity-50"
                >
                  {updatingMetadata ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Metadata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Sub-Modal */}
      {deletingResource && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-3">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 w-fit">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Delete Resource</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">"{deletingResource.title}"</strong>?
                The associated storage file will be permanently removed.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingResource(null)}
                disabled={deleteLoading}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteResource}
                disabled={deleteLoading}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonResourcesModal;
