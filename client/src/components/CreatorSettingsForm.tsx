import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Upload, Loader2, Instagram, Twitter, Globe, Music } from 'lucide-react';

interface CreatorProfile {
  id: number;
  alias: string;
  bio?: string | null;
  longBio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  location?: string | null;
  category?: string | null;
  socialInstagram?: string | null;
  socialTiktok?: string | null;
  socialTwitter?: string | null;
  socialWebsite?: string | null;
}

interface CreatorSettingsFormProps {
  profile: CreatorProfile;
  onSuccess?: () => void;
}

export function CreatorSettingsForm({ profile, onSuccess }: CreatorSettingsFormProps) {
  const [formData, setFormData] = useState({
    alias: profile.alias || '',
    bio: profile.bio || '',
    longBio: profile.longBio || '',
    location: profile.location || '',
    category: profile.category || '',
    avatarUrl: profile.avatarUrl || '',
    socialInstagram: profile.socialInstagram || '',
    socialTiktok: profile.socialTiktok || '',
    socialTwitter: profile.socialTwitter || '',
    socialWebsite: profile.socialWebsite || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const updateProfileMutation = trpc.creator.updateProfile.useMutation();
  const uploadAvatarMutation = trpc.creator.uploadAvatar.useMutation();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > 5) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    // Validate MIME type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP files are allowed');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const result = await uploadAvatarMutation.mutateAsync({
          base64,
          mimeType: file.type,
        });
        setAvatarPreview(result.avatarUrl);
        setFormData({ ...formData, avatarUrl: result.avatarUrl });
        toast.success('Avatar uploaded successfully');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Only send non-avatar fields to updateProfile
      await updateProfileMutation.mutateAsync({
        alias: formData.alias || undefined,
        bio: formData.bio || undefined,
        longBio: formData.longBio || undefined,
        location: formData.location || undefined,
        category: formData.category || undefined,
        socialInstagram: formData.socialInstagram || undefined,
        socialTiktok: formData.socialTiktok || undefined,
        socialTwitter: formData.socialTwitter || undefined,
        socialWebsite: formData.socialWebsite || undefined,
      });

      toast.success('Profile updated successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Upload a profile picture for your creator page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            {avatarPreview && (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="w-24 h-24 rounded-full object-cover border border-border"
              />
            )}
            <div className="flex-1">
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition">
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Click to upload avatar</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG up to 5MB</span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  disabled={isUploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update your creator name and bio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="alias">Creator Name</Label>
            <Input
              id="alias"
              value={formData.alias}
              onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
              placeholder="Your creator name"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="bio">Short Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief description (shown on profile)"
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.bio.length}/500 characters
            </p>
          </div>

          <div>
            <Label htmlFor="longBio">Long Bio</Label>
            <Textarea
              id="longBio"
              value={formData.longBio}
              onChange={(e) => setFormData({ ...formData, longBio: e.target.value })}
              placeholder="Detailed bio (shown on creator page)"
              maxLength={2000}
              rows={5}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.longBio.length}/2000 characters
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Music, Art, Writing"
                maxLength={100}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>Connect your social media accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </Label>
            <Input
              id="instagram"
              value={formData.socialInstagram}
              onChange={(e) => setFormData({ ...formData, socialInstagram: e.target.value })}
              placeholder="@username"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="tiktok" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              TikTok
            </Label>
            <Input
              id="tiktok"
              value={formData.socialTiktok}
              onChange={(e) => setFormData({ ...formData, socialTiktok: e.target.value })}
              placeholder="@username"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="twitter" className="flex items-center gap-2">
              <Twitter className="w-4 h-4" />
              Twitter / X
            </Label>
            <Input
              id="twitter"
              value={formData.socialTwitter}
              onChange={(e) => setFormData({ ...formData, socialTwitter: e.target.value })}
              placeholder="@username"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Website
            </Label>
            <Input
              id="website"
              value={formData.socialWebsite}
              onChange={(e) => setFormData({ ...formData, socialWebsite: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
