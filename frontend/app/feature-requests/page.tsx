"use client"
import React, { useState, useEffect } from 'react';
import { Search, Heart, Paperclip, X, Loader2, Trash2, Home, Users, Globe, Settings, LogOut, MessageSquare, Bell, ChevronDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const FeatureRequestPage = () => {
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Trending');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [upvotedFeatures, setUpvotedFeatures] = useState(new Set());
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  const router = useRouter();
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/auth");
      } else {
        setUserId(data.user.id);
        fetchFeatures();
        fetchUserUpvotes(data.user.id); // NEW: Fetch user's upvotes
        console.log("dashboard data", data.user);
      }
      setLoading(false);
    });
  }, []);

  // NEW: Fetch user's upvoted features
  const fetchUserUpvotes = async (userId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/feature/request/all/upvote/user/${userId}`);
      const data = await response.json();
      
      if (data.success && data.allupvotesuser) {
        const featureIds = data.allupvotesuser.map(
          (upvote: any) => upvote.featureId
        );
  
        setUpvotedFeatures(new Set(featureIds));
      }
    } catch (err) {
      console.error('Error fetching user upvotes:', err);
    }
  };
 
  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/feature/request/get/all/feature/request`);
      const data = await response.json();
      
      if (data.success) {
        setFeatures(data.feature || []);
      }
    } catch (err) {
      console.error('Error fetching features:', err);
      setError('Failed to load feature requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('userId', userId);
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${BACKEND_URL}/feature/request/add/new/feature/request`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setTitle('');
        setDescription('');
        setFiles([]);
        setSuccess('Feature request submitted successfully!');
        fetchFeatures();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to submit feature request');
      }
    } catch (err) {
      console.error('Error submitting:', err);
      setError('Failed to submit feature request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (featureId: any) => {
    const isUpvoted = upvotedFeatures.has(featureId);
    const endpoint = isUpvoted ? `${BACKEND_URL}/feature/request/downvote/feature` : `${BACKEND_URL}/feature/request/upvote/Feature`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId, userId }),
      });

      const data = await response.json();

      if (data.success) {
        const newUpvoted = new Set(upvotedFeatures);
        if (isUpvoted) {
          newUpvoted.delete(featureId);
        } else {
          newUpvoted.add(featureId);
        }
        setUpvotedFeatures(newUpvoted);
        fetchFeatures();
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleDelete = async (featureId: any) => {
    if (!confirm('Are you sure you want to delete this feature request?')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/feature/request/delete/feature`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId, userId }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Feature request deleted successfully!');
        fetchFeatures();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete feature request');
      }
    } catch (err) {
      console.error('Error deleting:', err);
      setError('Failed to delete feature request');
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      fetchFeatures();
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/feature/request/feature/request/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success) {
        setFeatures(data.data || []);
      }
    } catch (err) {
      console.error('Error searching:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleFileChange = (e: any) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: any) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
  
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  
    if (diffDays === 0) return `Today at ${time}`;
    if (diffDays === 1) return `Yesterday at ${time}`;
    if (diffDays < 7) return `${diffDays} days ago at ${time}`;
  
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ` at ${time}`;
  };
  
  const getInitials = (firstName: any, lastName: any) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-white flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 600 160" className="sm:w-[160px] sm:h-[50px]">
                <text x="40" y="110"
                      fill="#000000"
                      fontSize="104"
                      fontWeight="700"
                      letterSpacing="-4"
                      fontFamily="Arial, Helvetica, sans-serif">
                  intake
                </text>
              </svg>
              <img 
                src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766659954/favicon_wghbca.svg" 
                alt="" 
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 mt-2 sm:mt-3 ml-[-56px] sm:ml-[-74px]"
              />
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <button className="text-gray-600 hover:text-gray-900 font-medium">
              Dashboard
            </button>
            <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium hover:bg-indigo-700 transition-colors">
                  t
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <Home className="mr-3 h-5 w-5 text-gray-500" />
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="mr-3 h-5 w-5 text-gray-500" />
                  Members
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Globe className="mr-3 h-5 w-5 text-gray-500" />
                  Domains
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-3 h-5 w-5 text-gray-500" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-3 h-5 w-5 text-gray-500" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
                Dashboard
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center">
                <Home className="mr-3 h-5 w-5 text-gray-500" />
                Home
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center">
                <Users className="mr-3 h-5 w-5 text-gray-500" />
                Members
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center">
                <Globe className="mr-3 h-5 w-5 text-gray-500" />
                Domains
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center">
                <Settings className="mr-3 h-5 w-5 text-gray-500" />
                Settings
              </button>
              <button className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center">
                <LogOut className="mr-3 h-5 w-5 text-gray-500" />
                Log out
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start mb-8 sm:mb-16 gap-6">
          <div className="flex-1 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#37352F] mb-4 sm:mb-6">
              Feature requests and feedback
            </h2>
            <p className="text-gray-700 text-[15px] sm:text-[17px] mb-3 sm:mb-4 leading-relaxed">
              We believe that great products are built with the help and insights of their users. 
              That's why we've created this space for you to share your feedback, suggestions, and 
              feature requests. We look forward to hearing your thoughts and bringing your ideas to life.
            </p>
            <p className="text-gray-950 font-medium text-sm sm:text-base">
              You need to be logged in to your intake* account to create or upvote a request.
            </p>
          </div>
          <div className="hidden lg:block ml-5 flex-shrink-0">
            <img 
              src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1767711553/Share_pudiqb.webp" 
              alt="Feature illustration"
              className="w-48 xl:w-auto"
            />
          </div>
        </div>

        {/* Feature Request Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12 shadow-sm">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Feature Requests</h3>
          
          <Input
            type="text"
            placeholder="Short, descriptive title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-4 border-gray-300 focus:border-gray-400 focus:ring-0"
          />

          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Details
            </label>
            <Textarea
              placeholder="Any additional details about your feature request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none border-gray-300 focus:border-gray-400 focus:ring-0"
            />
          </div>

          {files.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {files.map((file: any, index: any) => (
                <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-md">
                  <span className="text-sm text-gray-700 truncate max-w-[200px]">{file.name}</span>
                  <button onClick={() => removeFile(index)} className="text-gray-500 hover:text-gray-700 flex-shrink-0">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
              {success}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3">
            <label className="cursor-pointer p-2 hover:bg-gray-50 rounded-md transition-colors self-start sm:self-auto">
              <Paperclip size={20} className="text-gray-600" />
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </label>
            <Button
              variant="outline"
              onClick={() => {
                setTitle('');
                setDescription('');
                setFiles([]);
                setError('');
              }}
              className="border-gray-300 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-pink-600 hover:bg-pink-700 text-white w-full sm:w-auto"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Request Feature
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-6 border-b border-gray-200 gap-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-gray-700 text-sm sm:text-base">Showing</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-gray-900 font-medium hover:text-gray-700 text-sm sm:text-base">
                  {sortBy}
                  <ChevronDown size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy('Trending')}>Trending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('Recent')}>Recent</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('Popular')}>Popular</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-gray-700 text-sm sm:text-base">posts</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-80 border-gray-300 focus:border-gray-400 focus:ring-0"
              />
            </div>
            <button className="p-2 hover:bg-gray-50 rounded-md flex-shrink-0">
              <Bell size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : features.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No feature requests found</p>
              {searchQuery && (
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search</p>
              )}
            </div>
          ) : (
            features.map((feature: any) => (
              <div
                key={feature.id}
                className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-gray-300 transition-all"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Upvote Button */}
                  <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
                    <button
                      onClick={() => handleUpvote(feature.id)}
                      className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 border border-pink-200 rounded-lg hover:bg-pink-50 transition-colors"
                    >
                      <div className="flex flex-col items-center">
                        <Heart 
                          size={16} 
                          className={`sm:w-[18px] sm:h-[18px] ${upvotedFeatures.has(feature.id) ? 'text-pink-600 fill-pink-600' : 'text-gray-600'}`}
                        />
                        <span className="text-xs font-semibold text-pink-600 mt-0.5">
                          {feature.likes || 0}
                        </span>
                      </div>
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 sm:gap-4 mb-3">
                      {/* Left: User + Title */}
                      <div className="flex flex-col gap-2 min-w-0 flex-1">
                        {/* User Info */}
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0">
                            <AvatarImage src={feature.user?.profile} />
                            <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                              {getInitials(feature.user?.firstName, feature.user?.lastName)}
                            </AvatarFallback>
                          </Avatar>

                          <span className="text-xs sm:text-sm text-gray-600 font-medium truncate">
                            {feature.user?.firstName} {feature.user?.lastName}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                          {feature.title}
                        </h3>
                      </div>

                      {/* Right: Status + Delete */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {feature.status && (
                          <Badge
                            variant="secondary"
                            className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs sm:text-sm"
                          >
                            {feature.status}
                          </Badge>
                        )}

                        {feature.ownerId === userId && (
                          <button
                            onClick={() => handleDelete(feature.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} className="sm:w-4 sm:h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed break-words">
                      {feature.description}
                    </p>

                    {/* Attachments */}
                    {feature.files?.length > 0 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {feature.files.map((file: any, idx: number) => (
                          <img
                            key={idx}
                            src={file.imageUrl}
                            alt="Attachment"
                            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded border border-gray-200 flex-shrink-0"
                          />
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500">
                      <span className="truncate">{formatDate(feature.createdAt)}</span>
                    </div>
                  </div>

                  {/* Three dots menu */}
                  <button className="p-2 hover:bg-gray-50 rounded-full transition-colors flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="1.5" fill="currentColor" className="text-gray-400"/>
                      <circle cx="10" cy="4" r="1.5" fill="currentColor" className="text-gray-400"/>
                      <circle cx="10" cy="16" r="1.5" fill="currentColor" className="text-gray-400"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureRequestPage;