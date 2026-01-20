import React, { useState, useEffect } from 'react';
import { X, Video, FileText, Download, Play, BookOpen, Clock, User, Award } from 'lucide-react';

const CourseMaterialsViewer = ({ course, onClose, API_URL }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  useEffect(() => {
    fetchMaterials();
  }, [course?.course_id]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/courses/${course.course_id}/materials`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch materials');
      }
      
      const data = await response.json();
      console.log('📚 Fetched materials:', data);
      setMaterials(data.materials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setMaterials([]);
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

  const renderMaterialPlayer = () => {
    if (!selectedMaterial) return null;

    const fileUrl = selectedMaterial.file_path;

    return (
      <div className="bg-gray-900 rounded-lg overflow-hidden mb-4">
        <div className="bg-gray-800 p-3 flex justify-between items-center">
          <h3 className="text-white font-semibold">{selectedMaterial.title}</h3>
          <button
            onClick={() => {
              setSelectedMaterial(null);
              setPlayingVideo(null);
            }}
            className="text-gray-400 hover:text-white"
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
          ) : (
            <div className="p-8 text-center">
              <FileText size={64} className="mx-auto mb-4 text-gray-400" />
              <p className="text-white mb-4">Preview not available for this file type</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Download size={16} />
                Download {selectedMaterial.type}
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
            <span>{(selectedMaterial.file_size / 1024 / 1024).toFixed(1)} MB</span>
          </div>
        </div>
      </div>
    );
  };

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
              {materials.length} Materials
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

        {/* Materials List */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Course Materials</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading materials...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <FileText size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No materials uploaded yet</p>
              <p className="text-sm text-gray-400 mt-2">Check back later for course content</p>
            </div>
          ) : (
            <div className="space-y-3">
              {materials.map((material, index) => (
                <div
                  key={material.id}
                  className={`bg-white rounded-lg p-4 border-2 transition cursor-pointer ${
                    selectedMaterial?.id === material.id
                      ? 'border-purple-500 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300 shadow-sm'
                  }`}
                  onClick={() => handlePlayMaterial(material)}
                >
                  <div className="flex items-start gap-4">
                    {/* Material Icon */}
                    <div className={`p-3 rounded-lg ${
                      material.type === 'video' ? 'bg-red-100' :
                      material.type === 'image' ? 'bg-blue-100' :
                      'bg-green-100'
                    }`}>
                      {material.type === 'video' ? (
                        <Video size={24} className="text-red-600" />
                      ) : material.type === 'image' ? (
                        <FileText size={24} className="text-blue-600" />
                      ) : (
                        <FileText size={24} className="text-green-600" />
                      )}
                    </div>

                    {/* Material Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-1">
                            {index + 1}. {material.title}
                          </h3>
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
                            <span>
                              {(material.file_size / 1024 / 1024).toFixed(1)} MB
                            </span>
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
                          className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition"
                        >
                          {material.type === 'video' ? 'Watch' : 'View'} Material
                        </button>
                        <a
                          href={material.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition flex items-center gap-1"
                        >
                          <Download size={14} />
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Description */}
        {course.description && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3">About This Course</h3>
            <p className="text-gray-600 leading-relaxed">{course.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseMaterialsViewer;