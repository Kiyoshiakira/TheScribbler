'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload } from 'lucide-react';
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  profile: { bio?: string, coverImageUrl?: string } | null;
}

export function EditProfileDialog({ open, onOpenChange, user, profile }: EditProfileDialogProps) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [bio, setBio] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
    }
    if (profile) {
      setBio(profile.bio || '');
      setCoverImageUrl(profile.coverImageUrl || '');
    }
  }, [user, profile, open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
     // Reset the input value to allow re-uploading the same file
    if (e.target) {
        e.target.value = '';
    }
  };

  
  const handleSave = async () => {
    if (!auth.currentUser || !firestore) return;
    setIsSaving(true);
    
    try {
      // Update Firebase Auth display name and photo
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL,
      });

      const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
      const profileData = { 
        displayName,
        email: auth.currentUser.email,
        bio, 
        coverImageUrl, 
        updatedAt: serverTimestamp() 
      };

      // Update custom data in Firestore (non-blocking with error handling)
      setDoc(userDocRef, profileData, { merge: true })
        .catch(serverError => {
          const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: profileData
          });
          errorEmitter.emit('permission-error', permissionError);
          toast({
            variant: "destructive",
            title: "Update Failed",
            description: "You may not have permission to update your profile.",
          });
        });

      toast({
          title: "Profile Update In Progress",
          description: "Your changes are being saved.",
      });
      onOpenChange(false);
      
      // A small delay and reload to ensure the UI reflects the auth changes.
      setTimeout(() => window.location.reload(), 1500);

    } catch (error: any) {
        console.error("Error initiating profile update:", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "An unknown client-side error occurred.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your public profile. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24">
                    <AvatarImage src={photoURL || undefined} alt={displayName} />
                    <AvatarFallback>{displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Photo
                    </Button>
                    <input
                        type="file"
                        ref={photoInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, setPhotoURL)}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="photoURL">Photo URL</Label>
                <Input
                    id="photoURL"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://example.com/your-avatar.jpg"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                 <div className="flex gap-2">
                    <Input
                        id="coverImageUrl"
                        value={coverImageUrl}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                        placeholder="https://example.com/your-banner.jpg"
                    />
                     <Button variant="outline" onClick={() => coverInputRef.current?.click()} className="flex-shrink-0">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                    </Button>
                      <input
                        type="file"
                        ref={coverInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, setCoverImageUrl)}
                    />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a little about yourself."
                />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
