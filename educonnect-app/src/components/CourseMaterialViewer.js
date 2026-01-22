import React, { useState, useEffect } from 'react';
import { X, Video, FileText, Download, Play, BookOpen, Clock, User, Award, FileImage, Presentation, Eye, Lock } from 'lucide-react';

const CourseMaterialsViewer = ({ course, onClose, API_URL }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  useEffect(() => {
    fetchSections();
  }, [course?.course_id]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/courses/${course.course_id}/sections`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sections');
      }
      
      const data = await response.json();
      console.log('📚 Fetched sections:', data);
      setSections(data.sections || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayMaterial = (material) => {
    console.log('🎬 Playing material:', material);
    setSelectedMaterial(material);
    
    if (material.type === 'video') {
      setPlayingVideo(material);
    }
  };

const handleDownloadMaterial = async (material, courseOfflineAvailable) => {
  if (!courseOfflineAvailable) {
    alert('This course is not available for offline download');
  }
    try {
      // Open material in new tab for download
      window.open(material.file_path, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download material');
    }
  };

  const getMaterialIcon = (type) => {
    switch(type) {
      case 'video':
        return <Video size={24} className="text-red-600" />;
      case 'image':
        return <FileImage size={24} className="text-blue-600" />;
      case 'presentation':
        return <Presentation size={24} className="text-orange-600" />;
      case 'document':
        return <FileText size={24} className="text-green-600" />;
      default:
        return <FileText size={24} className="text-gray-600" />;
    }
  };

  const getMaterialBgColor = (type) => {
    switch(type) {
      case 'video': return 'bg-red-100';
      case 'image': return 'bg-blue-100';
      case 'presentation': return 'bg-orange-100';
      case 'document': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };

 const renderMaterialPlayer = () => {
  if (!selectedMaterial) return null;

  const fileUrl = selectedMaterial.file_path;

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden mb-4">
      <div className="bg-gray-800 p-3 flex justify-between items-center">
        <div className="flex-1">
          <h3 className="text-white font-semibold">{selectedMaterial.title}</h3>
          {selectedMaterial.description && (
            <p className="text-gray-400 text-sm mt-1">
              {selectedMaterial.description}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setSelectedMaterial(null);
            setPlayingVideo(null);
          }}
          className="text-gray-400 hover:text-white ml-4"
        >
          <X size={20} />
        </button>
      </div>

      <div className="bg-black">
        {selectedMaterial.type === 'video' ? (
          <video
            key={fileUrl}
            controls
            autoPlay
            className="w-full max-h-[400px]"
            controlsList="nodownload"
          >
            <source src={fileUrl} type="video/mp4" />
            <source src={fileUrl} type="video/webm" />
            Your browser does not support the video tag.
          </video>
        ) : selectedMaterial.type === 'image' ? (
          <img
            src={fileUrl}
            alt={selectedMaterial.title}
            className="w-full max-h-[400px] object-contain"
          />
        ) : selectedMaterial.type === 'document' ? (
        fileUrl.toLowerCase().endsWith('.pdf') ? (
  <div className="p-8 text-center bg-gray-900">
    <FileText size={64} className="mx-auto mb-4 text-gray-400" />
    <p className="text-white mb-2 text-lg font-semibold">PDF Document</p>
    <p className="text-gray-400 mb-6 text-sm">{selectedMaterial.title}</p>

    <div className="flex gap-3 justify-center">
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        <Eye size={18} />
        Open PDF
      </a>

      {course.offline_available && (
        <a
          href={fileUrl}
          download
          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
        >
          <Download size={18} />
          Download PDF
        </a>
      )}
    </div>
  </div>
)

   
           : (
            <div className="p-8 text-center">
              <FileText size={64} className="mx-auto mb-4 text-gray-400" />
              <p className="text-white mb-4">Document preview</p>

              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Eye size={16} />
                Open Document
              </a>
            </div>
          )
        ) : selectedMaterial.type === 'presentation' ? (
          <div className="p-8 text-center">
            <Presentation size={64} className="mx-auto mb-4 text-orange-400" />
            <p className="text-white mb-4">Presentation preview</p>

            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Eye size={16} />
              Open Presentation
            </a>
          </div>
        ) : (
          <div className="p-8 text-center">
            <FileText size={64} className="mx-auto mb-4 text-gray-400" />
            <p className="text-white mb-4">
              Preview not available for this file type
            </p>

            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Eye size={16} />
              Open File
            </a>
          </div>
        )}
      </div>

      <div className="bg-gray-800 p-3 text-sm text-gray-300">
        <div className="flex gap-4">
          {selectedMaterial.duration && (
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {selectedMaterial.duration} min
            </span>
          )}
          <span className="capitalize">{selectedMaterial.type}</span>
          {selectedMaterial.file_size && (
            <span>
              {(selectedMaterial.file_size / 1024 / 1024).toFixed(1)} MB
            </span>
          )}
        </div>
      </div>
    </div>
  );
};


  const totalMaterials = sections.reduce((sum, section) => 
    sum + (section.materials?.length || 0), 0
  );

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg z-10">
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{course.course_title}</h1>
              <p className="text-purple-100 text-sm flex items-center gap-2">
                <User size={14} />
                by {course.tutor_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Course Stats */}
          <div className="flex gap-3 text-sm">
            <span className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
              <BookOpen size={14} />
              {sections.length} Sections
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              {totalMaterials} Materials
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              Progress: {course.progress}%
            </span>
            {course.completed && (
              <span className="bg-green-400 text-green-900 px-3 py-1 rounded-full flex items-center gap-1">
                <Award size={14} />
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 h-1">
          <div
            className="bg-white h-1 transition-all duration-300"
            style={{ width: `${course.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Material Player */}
        {renderMaterialPlayer()}

        {/* Course Description */}
        {course.description && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 shadow-sm border border-purple-200 mb-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <BookOpen size={20} className="text-purple-600" />
              About This Course
            </h3>
            <p className="text-gray-700 leading-relaxed">{course.description}</p>
          </div>
        )}

        {/* Sections and Materials */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Course Content</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading course content...</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No content uploaded yet</p>
              <p className="text-sm text-gray-400 mt-2">Check back later for course materials</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, sectionIndex) => (
                <div key={section.id} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                  {/* Section Header */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 border-b-2 border-purple-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-800">
                            Section {sectionIndex + 1}: {section.title}
                          </h3>
                       
                         
                        </div>
                        {section.description && (
                          <p className="text-sm text-gray-600">{section.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {section.materials?.length || 0} materials
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Materials List */}
                  {section.materials && section.materials.length > 0 ? (
                    <div className="p-3 space-y-2">
                      {section.materials.map((material, materialIndex) => (
                        <div
                          key={material.id}
                          className={`bg-white rounded-lg p-3 border-2 transition cursor-pointer ${
                            selectedMaterial?.id === material.id
                              ? 'border-purple-500 shadow-lg'
                              : 'border-gray-200 hover:border-purple-300 shadow-sm'
                          }`}
                          onClick={() => handlePlayMaterial(material)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Material Icon */}
                            <div className={`p-2 rounded-lg ${getMaterialBgColor(material.type)}`}>
                              {getMaterialIcon(material.type)}
                            </div>

                            {/* Material Info */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-1">
                                    {sectionIndex + 1}.{materialIndex + 1} {material.title}
                                  </h4>
                                  {material.description && (
                                    <p className="text-xs text-gray-600 mb-2">{material.description}</p>
                                  )}
                                  <div className="flex gap-3 text-xs text-gray-500">
                                    <span className="bg-gray-100 px-2 py-1 rounded capitalize">
                                      {material.type}
                                    </span>
                                    {material.duration && (
                                      <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {material.duration} min
                                      </span>
                                    )}
                                    {material.file_size && (
                                      <span>
                                        {(material.file_size / 1024 / 1024).toFixed(1)} MB
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {material.type === 'video' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePlayMaterial(material);
                                    }}
                                    className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition"
                                  >
                                    <Play size={16} />
                                  </button>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayMaterial(material);
                                  }}
                                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition flex items-center justify-center gap-1"
                                >
                                  <Eye size={14} />
                                  {material.type === 'video' ? 'Watch' : 'View'} Online
                                </button>
                                
                                
                               {/* Download Button - Only if COURSE allows offline */}
                                {course.offline_available ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadMaterial(material, course.offline_available);
                                    }}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition flex items-center gap-1"
                                  >
                                    <Download size={14} />
                                    Download
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm cursor-not-allowed flex items-center gap-1"
                                    title="This course is not available for offline download"
                                  >
                                    <Lock size={14} />
                                    Online Only
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No materials in this section yet</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-3">Legend</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Video size={16} className="text-red-600" />
                      <span className="text-gray-600">Video content</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-green-600" />
                      <span className="text-gray-600">Document (PDF, DOC)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Presentation size={16} className="text-orange-600" />
                      <span className="text-gray-600">Presentation (PPT)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileImage size={16} className="text-blue-600" />
                      <span className="text-gray-600">Image content</span>
                    </div>
                  </div>
                  
                  {course.offline_available && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Download size={16} className="text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Offline Available</p>
                          <p className="text-xs text-blue-700">
                            All materials in this course can be downloaded for offline viewing
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
      </div>
    </div>
  );
};

export default CourseMaterialsViewer;