"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import {
  Camera,
  MapPin,
  User,
  Settings,
  Heart,
  ShoppingCart,
  Package,
  Loader2,
  Save,
  Plus,
  Trash2,
} from "lucide-react"
import Link from "next/link"

interface Address {
  id: string
  address_line_1: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
}

interface ProfileData {
  first_name: string
  last_name: string
  phone: string
  birthdate: string
  gender: string
  bio: string
  avatar_url: string
  preferences: {
    newsletter: boolean
    sms_notifications: boolean
    email_notifications: boolean
    preferred_language: string
    currency: string
  }
}

export default function ProfilePage() {
  const { user, loading: authLoading, tokenReady, updateProfile, updateUserData } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [currentAddressId, setCurrentAddressId] = useState<string | null>(null)

  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    phone: "",
    birthdate: "",
    gender: "",
    bio: "",
    avatar_url: "",
    preferences: {
      newsletter: true,
      sms_notifications: false,
      email_notifications: true,
      preferred_language: "en",
      currency: "PHP",
    },
  })

  const [addressData, setAddressData] = useState({
    street_address: "",
    city: "",
    state_province: "",
    zip_code: "",
    country: "Philippines",
    is_default: false,
  })

  useEffect(() => {
    if (user && !authLoading && tokenReady) {
      console.log('👤 User changed and token ready, fetching profile data for:', user.email)
      // Only clear profile data if we don't have any existing data
      if (!profileData.first_name && !profileData.last_name) {
        setProfileData({
          first_name: user.firstName || "",
          last_name: user.lastName || "",
          phone: "",
          birthdate: "",
          gender: "",
          bio: "",
          avatar_url: user.avatar || "",
          preferences: {
            newsletter: true,
            sms_notifications: false,
            email_notifications: true,
            preferred_language: "en",
            currency: "PHP",
          },
        })
      }
      fetchProfileData()
    }
  }, [user, authLoading, tokenReady])

  // Also refetch when component mounts or user data updates (but not during auth loading)
  useEffect(() => {
    if (user && !authLoading && tokenReady && profileData.first_name === '' && profileData.last_name === '') {
      console.log('🔄 Profile data is empty and token ready, refetching...')
      fetchProfileData()
    }
  }, [user, authLoading, tokenReady, profileData.first_name, profileData.last_name])

  const fetchProfileData = async () => {
    if (!user) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/profiles?t=${Date.now()}&cache=${Math.random()}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store' // Force fresh data
      })

      if (response.ok) {
        const profile = await response.json()
        console.log('✅ Frontend: Profile data received:', JSON.stringify(profile, null, 2))
        console.log('📋 Frontend: Setting profile data with:', {
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url
        })
        console.log('📋 Profile data received:', profile)
        
        const newProfileData = {
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          phone: profile.phone || "",
          birthdate: profile.birthdate || "",
          gender: profile.gender || "",
          bio: profile.bio || "",
          avatar_url: profile.avatar_url || "",
          preferences: profile.preferences || {
            newsletter: true,
            sms_notifications: false,
            email_notifications: true,
            preferred_language: "en",
            currency: "PHP",
          },
        };
        console.log('🔄 Frontend: Setting new profile data:', newProfileData);
        setProfileData(newProfileData);
        console.log('✅ Frontend: Profile data state updated');
      } else {
        console.error('Failed to fetch profile:', response.status, response.statusText)
        // Create default profile data
        const defaultData = {
          first_name: user.firstName || "",
          last_name: user.lastName || "",
          phone: "",
          birthdate: "",
          gender: "",
          bio: "",
          avatar_url: user.avatar || "",
          preferences: {
            newsletter: true,
            sms_notifications: false,
            email_notifications: true,
            preferred_language: "en",
            currency: "PHP",
          },
        }
        setProfileData(defaultData)
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
      // Create default profile data
      const defaultData = {
        first_name: user.firstName || "",
        last_name: user.lastName || "",
        phone: "",
        birthdate: "",
        gender: "",
        bio: "",
        avatar_url: user.avatar || "",
        preferences: {
          newsletter: true,
          sms_notifications: false,
          email_notifications: true,
          preferred_language: "en",
          currency: "PHP",
        },
      }
      setProfileData(defaultData)
    }
  }

  useEffect(() => {
    if (user && tokenReady) {
      fetchAddresses()
    }
  }, [user, tokenReady])

  const fetchAddresses = async () => {
    if (!user) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/addresses', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        toast({
          title: "Error",
          description: "Failed to load addresses",
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
      setAddresses(data || [])

      if (data && data.length > 0) {
        const firstAddress = data[0]
        setCurrentAddressId(firstAddress.id)
        setAddressData({
          street_address: firstAddress.address_line_1 || "",
          city: firstAddress.city || "",
          state_province: firstAddress.state || "",
          zip_code: firstAddress.postal_code || "",
          country: firstAddress.country || "Philippines",
          is_default: firstAddress.is_default || false,
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load addresses",
        variant: "destructive",
      })
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to upload an avatar.',
        variant: 'destructive',
      })
      return
    }

    if (!event.target.files || event.target.files.length === 0) return

    const file = event.target.files[0]

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast({
          title: 'Upload failed',
          description: errorData.error || 'Failed to upload avatar',
          variant: 'destructive',
        })
        return
      }

      const data = await response.json()
      console.log('✅ Avatar uploaded successfully:', data)
      
      // Update the profile data with the new avatar URL
      setProfileData(prev => ({ ...prev, avatar_url: data.url }))
      
      // Also update the auth context
      await updateProfile({
        avatar: data.url,
      })

      toast({
        title: 'Success',
        description: data.message || 'Avatar updated successfully!',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Unexpected error occurred during avatar upload',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    console.log('🔍 PROFILE: handleSaveProfile called');
    console.log('🔍 PROFILE: user state:', user);
    console.log('🔍 PROFILE: profileData:', profileData);
    
    if (!user) {
      console.log('❌ PROFILE: No user found, aborting save');
      return
    }

    console.log('✅ PROFILE: User found, proceeding with save');
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      
      const requestBody = {
        first_name: profileData.first_name.trim(),
        last_name: profileData.last_name.trim(),
        phone: profileData.phone.trim(),
        birthdate: profileData.birthdate || '',
        gender: profileData.gender || '',
        bio: profileData.bio.trim(),
        avatar_url: profileData.avatar_url,
        preferences: profileData.preferences,
      }
      
      console.log('📝 PROFILE: Sending request body:', requestBody);
      console.log('🔗 PROFILE: Making PUT request to /api/profiles');
      
      const response = await fetch('/api/profiles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update profile",
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
      
      // Update the auth context directly without making another API call
      updateUserData({
        firstName: profileData.first_name.trim(),
        lastName: profileData.last_name.trim(),
        avatar: profileData.avatar_url,
      })

      // Refresh profile data from server to ensure consistency
      await fetchProfileData()

      toast({
        title: "Success",
        description: data.message || "Profile updated successfully!",
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAddress = async () => {
    if (!user) return

    if (!addressData.street_address.trim() || !addressData.city.trim()) {
      toast({
        title: "Error",
        description: "Street address and city are required",
        variant: "destructive",
      })
      return
    }

    setAddressLoading(true)
    try {
      const addressPayload = {
        address_line_1: addressData.street_address.trim(),
        city: addressData.city.trim(),
        state: addressData.state_province.trim(),
        postal_code: addressData.zip_code.trim(),
        country: addressData.country,
        first_name: profileData.first_name.trim() || user?.firstName || 'User',
        last_name: profileData.last_name.trim() || user?.lastName || 'Name',
        phone: profileData.phone.trim() || '',
        is_default: addressData.is_default,
      }

      const token = localStorage.getItem('auth_token')
      let response
      if (currentAddressId) {
        // Update existing address
        response = await fetch('/api/addresses', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: currentAddressId,
            ...addressPayload
          })
        })
      } else {
        // Create new address
        response = await fetch('/api/addresses', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(addressPayload)
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: `Failed to save address: ${errorData.error || 'Unknown error'}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Address saved successfully!",
      })

      await fetchAddresses()
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving address",
        variant: "destructive",
      })
    } finally {
      setAddressLoading(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!user || !confirm("Are you sure you want to delete this address?")) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/addresses?id=${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        toast({
          title: "Error",
          description: "Failed to delete address",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Address deleted successfully!",
      })

      if (currentAddressId === addressId) {
        setCurrentAddressId(null)
        setAddressData({
          street_address: "",
          city: "",
          state_province: "",
          zip_code: "",
          country: "Philippines",
          is_default: false,
        })
      }

      await fetchAddresses()
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleNewAddress = () => {
    setCurrentAddressId(null)
    setAddressData({
      street_address: "",
      city: "",
      state_province: "",
      zip_code: "",
      country: "Philippines",
      is_default: false,
    })
  }

  const handleEditAddress = (address: Address) => {
    setCurrentAddressId(address.id)
    setAddressData({
      street_address: address.address_line_1 || "",
      city: address.city || "",
      state_province: address.state || "",
      zip_code: address.postal_code || "",
      country: address.country || "Philippines",
      is_default: address.is_default || false,
    })
  }

  // Show loading only when auth is actually loading, not when user is null
  if (!user && authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If not loading and no user, redirect to login
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please log in to view your profile</p>
          <Link href="/auth" className="text-yellow-500 hover:text-yellow-400">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-yellow-500">My Profile</h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profileData.avatar_url || user?.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {profileData.first_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-3 -right-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer p-3"
                    style={{ boxShadow: '0 0 8px rgba(0,0,0,0.3)' }}
                  >
                    <Camera className="h-4 w-4" />
                  </label>
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  {profileData.first_name || profileData.last_name
                    ? `${profileData.first_name} ${profileData.last_name}`.trim()
                    : "User"}
                </h3>
                <p className="text-gray-400 mb-6">{user?.email}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-400">
                      <Heart className="h-4 w-4" />
                      Wishlist Items
                    </span>
                    <Badge variant="secondary">0</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-400">
                      <ShoppingCart className="h-4 w-4" />
                      Cart Items
                    </span>
                    <Badge variant="secondary">0</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-400">
                      <Package className="h-4 w-4" />
                      Total Orders
                    </span>
                    <Badge variant="secondary">0</Badge>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Button variant="outline" className="w-full border-gray-600 hover:bg-gray-700 bg-transparent" asChild>
                    <Link href="/wishlist">
                      <Heart className="h-4 w-4 mr-2" />
                      Wishlist
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full border-gray-600 hover:bg-gray-700 bg-transparent" asChild>
                    <Link href="/orders">
                      <Package className="h-4 w-4 mr-2" />
                      Orders
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Tabs defaultValue="personal" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                <TabsTrigger
                  value="personal"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Personal Info
                </TabsTrigger>
                <TabsTrigger
                  value="address"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Address
                </TabsTrigger>
                <TabsTrigger
                  value="preferences"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Preferences
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-500">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Update your personal details and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-gray-300">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          value={profileData.first_name}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, first_name: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-gray-300">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          value={profileData.last_name}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, last_name: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-300">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="+63 9XX XXX XXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth" className="text-gray-300">
                          Date of Birth
                        </Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={profileData.birthdate}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, birthdate: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-gray-300">
                        Gender
                      </Label>
                      <Select
                        value={profileData.gender}
                        onValueChange={(value) => setProfileData((prev) => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select your gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-gray-300">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                        className="bg-gray-700 border-gray-600 text-white resize-none"
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    </div>

                    <Button
                      onClick={(e) => {
                        console.log('🔘 PROFILE: Save button clicked!', e);
                        console.log('🔘 PROFILE: loading state:', loading);
                        console.log('🔘 PROFILE: Current profileData:', profileData);
                        handleSaveProfile();
                      }}
                      disabled={loading}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="address">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-yellow-500">
                          <MapPin className="h-5 w-5" />
                          Address Information
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Manage your shipping and billing addresses
                        </CardDescription>
                      </div>
                      <Button
                        onClick={handleNewAddress}
                        variant="outline"
                        className="border-gray-600 hover:bg-gray-700 bg-transparent"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Address
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="streetAddress" className="text-gray-300">
                          Street Address
                        </Label>
                        <Input
                          id="streetAddress"
                          value={addressData.street_address}
                          onChange={(e) => setAddressData((prev) => ({ ...prev, street_address: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="123 Main Street"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-gray-300">
                            City
                          </Label>
                          <Input
                            id="city"
                            value={addressData.city}
                            onChange={(e) => setAddressData((prev) => ({ ...prev, city: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder="Cabuyao City"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stateProvince" className="text-gray-300">
                            State/Province
                          </Label>
                          <Input
                            id="stateProvince"
                            value={addressData.state_province}
                            onChange={(e) => setAddressData((prev) => ({ ...prev, state_province: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder="Metro Manila"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="zipCode" className="text-gray-300">
                            ZIP Code
                          </Label>
                          <Input
                            id="zipCode"
                            value={addressData.zip_code}
                            onChange={(e) => setAddressData((prev) => ({ ...prev, zip_code: e.target.value }))}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder="1000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-gray-300">
                            Country
                          </Label>
                          <Select
                            value={addressData.country}
                            onValueChange={(value) => setAddressData((prev) => ({ ...prev, country: value }))}
                          >
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="Philippines">Philippines</SelectItem>
                              <SelectItem value="United States">United States</SelectItem>
                              <SelectItem value="Canada">Canada</SelectItem>
                              <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                              <SelectItem value="Australia">Australia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isDefault"
                          checked={addressData.is_default}
                          onCheckedChange={(checked) => setAddressData((prev) => ({ ...prev, is_default: checked }))}
                        />
                        <Label htmlFor="isDefault" className="text-gray-300">
                          Set as default address
                        </Label>
                      </div>

                      <Button
                        onClick={handleSaveAddress}
                        disabled={addressLoading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {addressLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Address
                      </Button>
                    </div>

                    {addresses.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Saved Addresses</h3>
                        <div className="space-y-3">
                          {addresses.map((address) => (
                            <div
                              key={address.id}
                              className="p-4 bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-white">{address.address_line_1}</p>
                                  {address.is_default && (
                                    <Badge className="bg-primary text-primary-foreground text-xs">Default</Badge>
                                  )}
                                </div>
                                <p className="text-gray-300 text-sm">
                                  {address.city}, {address.state} {address.postal_code}
                                </p>
                                <p className="text-gray-400 text-sm">{address.country}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => handleEditAddress(address)}
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-600 hover:bg-gray-600"
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => handleDeleteAddress(address.id)}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-600 text-red-400 hover:bg-red-900"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-500">
                      <Settings className="h-5 w-5" />
                      Preferences
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Customize your account preferences and notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Notifications</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-gray-300">Email Notifications</Label>
                            <p className="text-sm text-gray-400">Receive updates via email</p>
                          </div>
                          <Switch
                            checked={profileData.preferences.email_notifications}
                            onCheckedChange={(checked) =>
                              setProfileData((prev) => ({
                                ...prev,
                                preferences: { ...prev.preferences, email_notifications: checked },
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-gray-300">SMS Notifications</Label>
                            <p className="text-sm text-gray-400">Receive updates via SMS</p>
                          </div>
                          <Switch
                            checked={profileData.preferences.sms_notifications}
                            onCheckedChange={(checked) =>
                              setProfileData((prev) => ({
                                ...prev,
                                preferences: { ...prev.preferences, sms_notifications: checked },
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-gray-300">Newsletter</Label>
                            <p className="text-sm text-gray-400">Receive our newsletter and promotions</p>
                          </div>
                          <Switch
                            checked={profileData.preferences.newsletter}
                            onCheckedChange={(checked) =>
                              setProfileData((prev) => ({
                                ...prev,
                                preferences: { ...prev.preferences, newsletter: checked },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Regional Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-gray-300">Preferred Language</Label>
                          <Select
                            value={profileData.preferences.preferred_language}
                            onValueChange={(value) =>
                              setProfileData((prev) => ({
                                ...prev,
                                preferences: { ...prev.preferences, preferred_language: value },
                              }))
                            }
                          >
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="fil">Filipino</SelectItem>
                              <SelectItem value="es">Spanish</SelectItem>
                              <SelectItem value="zh">Chinese</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-300">Currency</Label>
                          <Select
                            value={profileData.preferences.currency}
                            onValueChange={(value) =>
                              setProfileData((prev) => ({
                                ...prev,
                                preferences: { ...prev.preferences, currency: value },
                              }))
                            }
                          >
                            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="PHP">PHP (₱)</SelectItem>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={(e) => {
                        console.log('🔘 PROFILE: Save Preferences button clicked!', e);
                        console.log('🔘 PROFILE: loading state:', loading);
                        console.log('🔘 PROFILE: Current profileData:', profileData);
                        handleSaveProfile();
                      }}
                      disabled={loading}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Preferences
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
