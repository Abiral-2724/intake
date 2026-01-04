"use client";

import React, { useState, useEffect } from 'react';
import { Link2, AlertTriangle, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
// import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState('');
  const [gender, setGender] = useState('');
  const [role, setRole] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('');
  const [typeOfWorkYouDo, setTypeOfWorkYouDo] = useState('');
  const [yourRole, setYourRole] = useState('');
  const [whereYouDiscoverIntake, setWhereYouDiscoverIntake] = useState('');
  
  const [userId, setUserId] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ;
  
  // const { toast } = useToast();

  // Enum options
  const genderOptions = ['Male', 'Female', 'Other'];
  const roleOptions = ['user', 'admin'];
  const planOptions = ['Free', 'Pro', 'Business'];
  const typeWorkOptions = [
    'Student', 'Educator', 'Product', 'Engineering', 'Design', 'Sales',
    'Marketing', 'CustomerService', 'BusinessAdministration', 'Operations',
    'HumanResources', 'IT', 'Finance', 'ArtsAndEntertainment',
    'HealthAndMedicine', 'SocialImpact', 'LawAndPublicPolicy', 'Government', 'Other'
  ];
  const whereDiscoverOptions = [
    'RecommendationFromfriend', 'RecommendationFromCoWorker', 
    'RecommendationFromCommunity', 'XorTwitter', 'TikTok', 'Reddit',
    'IndieHackers', 'LinkedIn', 'YouTube', 'Instagram', 'Onlinesearch',
    'Newsletter', 'Facebook', 'ProductHunt', 'Blogpost', 'Podcast', 'AI', 'Other'
  ];
  const router = useRouter() ;
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/auth");
      } else {
       
        setUserId(data.user.id);
    fetchUserProfile(data.user.id);
        console.log("dashboard data" ,data.user) ; 
      }
      setLoading(false);
    });
    // Replace this with your actual auth logic
    // const userIdFromAuth = localStorage.getItem('userId') || 'your-user-id';
    // setUserId(userIdFromAuth);
    // fetchUserProfile(userIdFromAuth);
  }, []);

  const fetchUserProfile = async (uid : any) => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/auth/get/profile/${uid}`);
      const data = await response.json();
      
      if (data.success) {
        const user = data.userProfile;
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setEmail(user.email || '');
        setProfile(user.profile || '');
        setImagePreview(user.profile || '');
        setGender(user.gender || '');
        setRole(user.role || '');
        setSubscriptionPlan(user.subscriptionPlan || '');
        setTypeOfWorkYouDo(user.typeOfWorkYouDo || '');
        setYourRole(user.yourRole || '');
        setWhereYouDiscoverIntake(user.whereYouDiscoverIntake || '');
      } else {
        // toast({
        //   title: "Error",
        //   description: data.message,
        //   variant: "destructive",
        // });
      }
    } catch (error) {
      // toast({
      //   title: "Error",
      //   description: "Failed to fetch user profile",
      //   variant: "destructive",
      // });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('gender', gender);
      formData.append('role', role);
      formData.append('subscriptionPlan', subscriptionPlan);
      formData.append('typeOfWorkYouDo', typeOfWorkYouDo);
      formData.append('yourRole', yourRole);
      formData.append('whereYouDiscoverIntake', whereYouDiscoverIntake);
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch(`${BACKEND_URL}/auth/profile/update`, {
        method: 'PATCH',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // toast({
        //   title: "Success",
        //   description: "Profile updated successfully!",
        // });
        setProfile(data.updatedUser.profile);
        setImageFile(null);
      } else {
        // toast({
        //   title: "Error",
        //   description: data.message,
        //   variant: "destructive",
        // });
      }
    } catch (error) {
      // toast({
      //   title: "Error",
      //   description: "Failed to update profile",
      //   variant: "destructive",
      // });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmed) {
      // toast({
      //   title: "Confirmation Required",
      //   description: "Please check the confirmation box",
      //   variant: "destructive",
      // });
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`${BACKEND_URL}/auth/profile/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        // toast({
        //   title: "Account Deleted",
        //   description: "Your account has been permanently deleted",
        // });
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        // toast({
        //   title: "Error",
        //   description: data.message,
        //   variant: "destructive",
        // });
      }
    } catch (error) {
      // toast({
      //   title: "Error",
      //   description: "Failed to delete account",
      //   variant: "destructive",
      // });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmed(false);
    }
  };

  const formatEnumLabel = (value) => {
    return value.replace(/([A-Z])/g, ' $1').trim();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Personal Information Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        
        {/* Photo Section */}
        <div className="mb-6">
          <Label className="block text-sm font-medium mb-2">Photo</Label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-white text-4xl font-light overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                firstName?.charAt(0)?.toLowerCase() || 'U'
              )}
            </div>
            <div>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <Label className="block text-sm font-medium mb-2">First name</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
            />
          </div>

          {/* Last Name */}
          <div>
            <Label className="block text-sm font-medium mb-2">Last name</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
            />
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <Label className="block text-sm font-medium mb-2">Email</Label>
            <div className="flex items-center gap-2">
              <Input value={email} disabled className="flex-1 bg-gray-50" />
             
            </div>
          </div>

          {/* Gender */}
          <div>
            <Label className="block text-sm font-medium mb-2">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Your Role (Text Input) */}
          <div>
            <Label className="block text-sm font-medium mb-2">Your Role</Label>
            <Input
              value={yourRole}
              onChange={(e) => setYourRole(e.target.value)}
              placeholder="e.g. Senior Developer"
            />
          </div>
        </div>

        {/* Password */}
        {/* <div className="mt-4">
          <Label className="block text-sm font-medium mb-2">Password</Label>
          <Button variant="ghost" className="text-gray-600 px-0">
            Set password
          </Button>
        </div> */}
      </div>

      <Separator />

      {/* Account Settings Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Role */}
         

        
          {/* Type of Work */}
          <div>
            <Label className="block text-sm font-medium mb-2">Type of Work You Do</Label>
            <Select value={typeOfWorkYouDo} onValueChange={setTypeOfWorkYouDo}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder="Select work type" />
              </SelectTrigger>
              <SelectContent>
                {typeWorkOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {formatEnumLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Where You Discovered */}
          <div>
            <Label className="block text-sm font-medium mb-2">Where You Discovered Us</Label>
            <Select value={whereYouDiscoverIntake} onValueChange={setWhereYouDiscoverIntake}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {whereDiscoverOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {formatEnumLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Update Button */}
      <div>
        <Button 
          className="bg-black text-white hover:bg-gray-800"
          onClick={handleUpdateProfile}
          disabled={updating}
        >
          {updating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Profile'
          )}
        </Button>
      </div>

      <Separator />

      {/* Connected Accounts */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Connected accounts</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Connect your account with Google or Apple to enable faster, secure
          and more convenient access.
        </p>

        <div className="space-y-4">
          {/* Google Account */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Google</span>
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              </div>
            </div>
            <Button variant="ghost" className="text-gray-600">
              Disconnect
            </Button>
          </div>

          {/* Apple Account */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </div>
              <span className="font-medium">Apple</span>
            </div>
            <Button variant="ghost" className="text-gray-600">
              Connect
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Danger Zone */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold">Danger zone</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          This will permanently delete your entire account. All your forms,
          submissions and workspaces will be deleted.
        </p>
        <Button 
          variant="destructive" 
          className="bg-red-800 hover:bg-red-700"
          onClick={() => setShowDeleteModal(true)}
        >
          Delete account
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Delete account</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-1">
            <DialogDescription className="text-sm text-gray-900">
              If you are sure you want to proceed with the deletion of your account, please continue below.
            </DialogDescription>
            
            <DialogDescription className="text-sm text-gray-900">
              Keep in mind this operation is irreversible and will result in a complete deletion of all your account data - all your forms, submissions and workspaces will be deleted.
            </DialogDescription>
            
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox 
                id="delete-confirm" 
                checked={deleteConfirmed}
                onCheckedChange={(checked) => setDeleteConfirmed(checked === true)}
              />
              <Label 
                htmlFor="delete-confirm" 
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                I acknowledge I understand that all of my account data will be deleted and want to proceed.
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleDeleteAccount}
              disabled={!deleteConfirmed || deleting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete my account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}