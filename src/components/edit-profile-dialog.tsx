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
import { ScrollArea } from './ui/scroll-area';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  profile: { bio?: string, coverImageUrl?: string, photoURL?: string } | null;
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
      setPhotoURL(profile?.photoURL || user.photoURL || '');
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
    if (e.target) {
        e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser || !firestore) return;
    setIsSaving(true);
    
    try {
      // Update core Firebase Auth profile only if displayName has changed.
      // This avoids saving large data URIs to the auth profile.
      if (auth.currentUser.displayName !== displayName) {
         await updateProfile(auth.currentUser, {
          displayName,
        });
      }
     
      // Save large data (like data-uri images) and other metadata to Firestore.
      const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
      const profileData = { 
        displayName,
        email: auth.currentUser.email,
        photoURL,
        bio, 
        coverImageUrl, 
        updatedAt: serverTimestamp() 
      };

      // Use setDoc with merge to create or update the user's profile document.
      await setDoc(userDocRef, profileData, { merge: true });

      toast({
          title: "Profile Updated",
          description: "Your changes have been saved.",
      });
      onOpenChange(false);
      
    } catch (error: any) {
        // This will now catch errors from either updateProfile or setDoc.
        // It's more likely to be a permission error from Firestore now.
        const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
        if (error.code?.startsWith('auth/')) {
             toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message,
            });
        } else {
             const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: { displayName, bio, photoURL, coverImageUrl },
             });
             errorEmitter.emit('permission-error', permissionError);
             toast({
                variant: "destructive",
                title: "Update Failed",
                description: "You may not have permission to update your profile.",
            });
        }
        console.error("Error saving profile:", error);
    } finally {
        setIsSaving(false);
    }
  };
  
  const getDisplayValue = (value: string) => {
      if (value.startsWith('data:image')) {
          return '[Uploaded Image]';
      }
      return value;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your public profile. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
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
                      value={getDisplayValue(photoURL)}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      placeholder="https://example.com/your-avatar.jpg"
                      readOnly={photoURL.startsWith('data:image')}
                  />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                  <div className="flex gap-2">
                      <Input
                          id="coverImageUrl"
                          value={getDisplayValue(coverImageUrl)}
                          onChange={(e) => setCoverImageUrl(e.target.value)}
                          placeholder="https://example.com/your-banner.jpg"
                          readOnly={coverImageUrl.startsWith('data:image')}
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
                      rows={5}
                  />
              </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-auto pt-4 border-t">
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
