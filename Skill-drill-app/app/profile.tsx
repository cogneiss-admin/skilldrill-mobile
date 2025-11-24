import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Modal, FlatList, Image, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import BottomNavigation from '../components/BottomNavigation';
import { BRAND } from './components/Brand';
import { useAuth } from '../hooks/useAuth';
import { useCountries, getConvertedFlagUrl } from '../hooks/useCountries';
import CountryPickerModal from './components/CountryPickerModal';
import CodeBoxes from '../components/CodeBoxes';
import { isValidEmail, isValidPhone, validationMessageFor } from './components/validators';
import ProfileSkeleton from './components/ProfileSkeleton';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [careerLevelId, setCareerLevelId] = useState<string | null>(null);
  const [careerLevelName, setCareerLevelName] = useState<string>('');
  const [roleTypeId, setRoleTypeId] = useState<string | null>(null);
  const [roleTypeName, setRoleTypeName] = useState<string>('');
  const [careerLevels, setCareerLevels] = useState<Array<{ id: string; name: string }>>([]);
  const [roleTypes, setRoleTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [showCLPicker, setShowCLPicker] = useState(false);
  const [showRTPicker, setShowRTPicker] = useState(false);
  const [loadingCL, setLoadingCL] = useState(false);
  const [loadingRT, setLoadingRT] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('IN');
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [originalPhoneNo, setOriginalPhoneNo] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [originalCareerLevelId, setOriginalCareerLevelId] = useState<string | null>(null);
  const [originalRoleTypeId, setOriginalRoleTypeId] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSheetVisible, setOtpSheetVisible] = useState(false);
  const [otpMode, setOtpMode] = useState<'email' | 'phone'>('email');
  const [otpTarget, setOtpTarget] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendRemaining, setResendRemaining] = useState(0);
  const resendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [phoneValidationError, setPhoneValidationError] = useState('');
  const [emailValidationError, setEmailValidationError] = useState('');
  const [phoneCheckingDB, setPhoneCheckingDB] = useState(false);
  const [emailCheckingDB, setEmailCheckingDB] = useState(false);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { countries } = useCountries();
  const initial = useMemo(() => (name?.trim()?.[0]?.toUpperCase() || 'U'), [name]);

  // Get selected phone country data
  const selectedPhoneCountry = useMemo(() => {
    return countries.find(c => c.code === selectedCountryCode) || { 
      code: 'IN', 
      name: 'India',
      phoneCode: '+91',
      flag: null,
    };
  }, [countries, selectedCountryCode]);

  // Parse existing phone number to extract country code and local number
  useEffect(() => {
    if (phoneNo && !isEditingPhone) {
      // Try to extract country code from phone number
      const phoneMatch = phoneNo.match(/^(\+\d{1,4})(.+)$/);
      if (phoneMatch) {
        const [, countryCode, localNumber] = phoneMatch;
        // Find country by phone code
        const country = countries.find(c => c.phoneCode === countryCode);
        if (country) {
          setSelectedCountryCode(country.code);
          setFormattedPhoneNumber(localNumber);
        } else {
          // Default to IN if country not found
          setFormattedPhoneNumber(phoneNo.replace(/^\+91/, ''));
        }
      } else {
        // No country code found, assume local number
        setFormattedPhoneNumber(phoneNo);
      }
    }
  }, [phoneNo, countries, isEditingPhone]);

  // Get international phone number
  const internationalPhone = useMemo(() => {
    if (!formattedPhoneNumber.trim()) return '';
    const phoneCode = selectedPhoneCountry?.phoneCode || '+91';
    return `${phoneCode}${formattedPhoneNumber.trim().replace(/[^0-9]/g, '')}`;
  }, [formattedPhoneNumber, selectedPhoneCountry]);

  // Phone validation
  const phoneValid = useMemo(() => {
    if (!isEditingPhone || !formattedPhoneNumber.trim()) return true; // Don't validate if not editing
    return isValidPhone(internationalPhone);
  }, [isEditingPhone, formattedPhoneNumber, internationalPhone]);

  // Email validation
  const emailValid = useMemo(() => {
    if (!email.trim()) return true; // Empty email is valid (optional field)
    return isValidEmail(email.trim());
  }, [email]);

  // Check if phone/email has changed, is valid, and passes DB checks
  const phoneChanged = useMemo(() => {
    if (!isEditingPhone || !phoneValid || phoneValidationError || phoneCheckingDB) return false;
    const currentPhone = internationalPhone;
    return currentPhone && currentPhone !== originalPhoneNo;
  }, [isEditingPhone, internationalPhone, originalPhoneNo, phoneValid, phoneValidationError, phoneCheckingDB]);

  const emailChanged = useMemo(() => {
    if (!emailValid || emailValidationError || emailCheckingDB) return false;
    return email && email.trim().toLowerCase() !== originalEmail.toLowerCase();
  }, [email, originalEmail, emailValid, emailValidationError, emailCheckingDB]);

  // Reset verified status when phone changes
  useEffect(() => {
    if (isEditingPhone && internationalPhone && internationalPhone !== originalPhoneNo) {
      setPhoneVerified(false);
    }
  }, [isEditingPhone, internationalPhone, originalPhoneNo]);

  // Reset verified status when email changes
  useEffect(() => {
    if (email && email.trim().toLowerCase() !== originalEmail.toLowerCase()) {
      setEmailVerified(false);
    }
  }, [email, originalEmail]);

  // Real-time validation with DB checks (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    if (!isEditingPhone || !formattedPhoneNumber.trim()) {
      setPhoneValidationError('');
      return;
    }

    // Format validation
    const formatError = validationMessageFor(internationalPhone);
    if (formatError) {
      setPhoneValidationError(formatError);
      return;
    }

    // Don't validate if phone is same as original when user first enters edit mode
    // Only show error if they actually change it to something else first, then change it back
    // For now, skip validation if it's the same as original to avoid false errors
    // The backend will catch this when they try to send OTP
    if (originalPhoneNo && internationalPhone === originalPhoneNo) {
      setPhoneValidationError('');
      setPhoneCheckingDB(false);
      return;
    }

    // Debounced DB check (wait 500ms after user stops typing)
    setPhoneCheckingDB(true);
    validationTimeoutRef.current = setTimeout(async () => {
      try {
        const { authService } = await import('../services/authService');
        const response = await authService.validateProfileUpdateField({
          phoneNo: internationalPhone,
          countryCode: selectedCountryCode
        });
        
        if (!response.success) {
          // Handle specific error codes
          if (response.code === 'PHONE_EXISTS') {
            setPhoneValidationError('Entered phone number already exists!');
          } else if (response.code === 'VALIDATION_ERROR') {
            // Only show "same as current" error if user is editing (has changed something)
            const errorMsg = response.message || 'Invalid phone number';
            if (errorMsg.includes('same as') && !formattedPhoneNumber.trim()) {
              // Don't show if field is empty
              setPhoneValidationError('');
            } else {
              setPhoneValidationError(errorMsg);
            }
          } else {
            setPhoneValidationError(response.message || 'Invalid phone number');
          }
        } else {
          // Valid and available - clear error
          setPhoneValidationError('');
        }
      } catch (error: unknown) {
        // Only show error if it's about phone existing or validation
        const errorObj = error as { response?: { data?: { code?: string; message?: string } } } | undefined;
        if (errorObj?.response?.data?.code === 'PHONE_EXISTS') {
          setPhoneValidationError('Entered phone number already exists!');
        } else if (errorObj?.response?.data?.code === 'VALIDATION_ERROR') {
          const errorMsg = errorObj.response.data.message || 'Invalid phone number';
          if (errorMsg.includes('same as') && !formattedPhoneNumber.trim()) {
            setPhoneValidationError('');
          } else {
            setPhoneValidationError(errorMsg);
          }
        }
        // Don't show error for network issues - user might be offline
      } finally {
        setPhoneCheckingDB(false);
      }
    }, 500);

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [isEditingPhone, formattedPhoneNumber, internationalPhone, originalPhoneNo, selectedCountryCode]);

  useEffect(() => {
    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    if (!email.trim()) {
      setEmailValidationError('');
      return;
    }

    // Format validation
    const formatError = validationMessageFor(email.trim());
    if (formatError) {
      setEmailValidationError(formatError);
      return;
    }

    // Don't validate if email is same as original (user hasn't changed it)
    // This prevents false "same as current" errors on page load
    if (originalEmail && email.trim().toLowerCase() === originalEmail.toLowerCase()) {
      setEmailValidationError('');
      setEmailCheckingDB(false);
      return;
    }

    // Debounced DB check (wait 500ms after user stops typing)
    setEmailCheckingDB(true);
    validationTimeoutRef.current = setTimeout(async () => {
      try {
        const { authService } = await import('../services/authService');
        const response = await authService.validateProfileUpdateField({
          email: email.trim()
        });
        
        if (!response.success) {
          // Handle specific error codes
          if (response.code === 'EMAIL_EXISTS') {
            setEmailValidationError('Entered email already exists!');
          } else if (response.code === 'VALIDATION_ERROR') {
            // Only show "same as current" error if user has changed email
            const errorMsg = response.message || 'Invalid email address';
            if (errorMsg.includes('same as') && email.trim().toLowerCase() === originalEmail.toLowerCase()) {
              // Don't show if it's the original email
              setEmailValidationError('');
            } else {
              setEmailValidationError(errorMsg);
            }
          } else {
            setEmailValidationError(response.message || 'Invalid email address');
          }
        } else {
          // Valid and available - clear error
          setEmailValidationError('');
        }
      } catch (error: unknown) {
        // Only show error if it's about email existing or validation
        const errorObj = error as { response?: { data?: { code?: string; message?: string } } } | undefined;
        if (errorObj?.response?.data?.code === 'EMAIL_EXISTS') {
          setEmailValidationError('Entered email already exists!');
        } else if (error?.response?.data?.code === 'VALIDATION_ERROR') {
          const errorMsg = error.response.data.message || 'Invalid email address';
          if (errorMsg.includes('same as') && email.trim().toLowerCase() === originalEmail.toLowerCase()) {
            setEmailValidationError('');
          } else {
            setEmailValidationError(errorMsg);
          }
        }
        // Don't show error for network issues
      } finally {
        setEmailCheckingDB(false);
      }
    }, 500);

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [email, originalEmail]);

  // Resend timer
  useEffect(() => {
    if (resendRemaining > 0) {
      resendTimerRef.current = setInterval(() => {
        setResendRemaining((prev) => {
          if (prev <= 1) {
            if (resendTimerRef.current) {
              clearInterval(resendTimerRef.current);
              resendTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
        resendTimerRef.current = null;
      }
    };
  }, [resendRemaining]);

  // Send OTP for phone (for profile update)
  const handleSendPhoneOtp = async () => {
    if (!phoneChanged || !phoneValid || otpBusy || phoneValidationError) return;
    try {
      setOtpBusy(true);
      setOtpError('');
      setPhoneValidationError('');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const { authService } = await import('../services/authService');
      const response = await authService.sendProfileUpdateOTP({
        phoneNo: internationalPhone,
        countryCode: selectedCountryCode
      });
      
      if (response.success) {
        setOtpMode('phone');
        setOtpTarget(internationalPhone);
        setOtpDigits(['', '', '', '', '', '']);
        setOtpSheetVisible(true);
        setResendRemaining(30);
        try { await Haptics.selectionAsync(); } catch {}
      } else {
        if (response.code === 'PHONE_EXISTS') {
          setPhoneValidationError('Entered phone number already exists!');
        } else {
          setPhoneValidationError(response.message || 'Failed to send OTP');
        }
      }
    } catch (error: unknown) {
      const { authService } = await import('../services/authService');
      const errorObj = error as { response?: { data?: { code?: string } } } | undefined;
      if (errorObj?.response?.data?.code === 'PHONE_EXISTS') {
        setPhoneValidationError('Entered phone number already exists!');
      } else {
        const errorMessage = authService.handleAuthError?.(error) || error?.message || 'Failed to send OTP';
        setPhoneValidationError(errorMessage);
      }
    } finally {
      setOtpBusy(false);
    }
  };

  // Send OTP for email (for profile update)
  const handleSendEmailOtp = async () => {
    if (!emailChanged || !emailValid || otpBusy || emailValidationError) return;
    try {
      setOtpBusy(true);
      setOtpError('');
      setEmailValidationError('');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const { authService } = await import('../services/authService');
      const response = await authService.sendProfileUpdateOTP({
        email: email.trim()
      });
      
      if (response.success) {
        setOtpMode('email');
        setOtpTarget(email.trim());
        setOtpDigits(['', '', '', '', '', '']);
        setOtpSheetVisible(true);
        setResendRemaining(30);
        try { await Haptics.selectionAsync(); } catch {}
      } else {
        if (response.code === 'EMAIL_EXISTS') {
          setEmailValidationError('Entered email already exists!');
        } else {
          setEmailValidationError(response.message || 'Failed to send OTP');
        }
      }
    } catch (error: unknown) {
      const { authService } = await import('../services/authService');
      const errorObj = error as { response?: { data?: { code?: string } } } | undefined;
      if (errorObj?.response?.data?.code === 'EMAIL_EXISTS') {
        setEmailValidationError('Entered email already exists!');
      } else {
        const errorMessage = authService.handleAuthError?.(error) || error?.message || 'Failed to send OTP';
        setEmailValidationError(errorMessage);
      }
    } finally {
      setOtpBusy(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = useCallback(async () => {
    if (otpBusy) return;
    const code = otpDigits.join('');
    if (!/^\d{6}$/.test(code)) return;
    
    try {
      setOtpBusy(true);
      setOtpError('');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const { authService } = await import('../services/authService');
      
      // Use profile-specific OTP verification endpoint
      const verifyPayload: { otp: string } = { otp: code };
      if (otpMode === 'phone') {
        verifyPayload.phoneNo = otpTarget;
        verifyPayload.countryCode = selectedCountryCode;
      } else {
        verifyPayload.email = otpTarget;
      }
      
      const response = await authService.verifyProfileUpdateOTP(verifyPayload);
      
      if (response.success && response.data?.verified) {
        try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        setOtpVerified(true);
        
        // Only mark field as verified locally - don't update backend yet
        // Backend update will happen when user clicks "Update Details"
        if (otpMode === 'phone') {
          // Phone is verified - otpTarget has the verified phone in E.164 format
          // Parse it and store in input field
          const verifiedPhone = otpTarget; // E.164 format like +918511599964
          setPhoneNo(verifiedPhone); // Store verified phone
          setPhoneVerified(true);
          
          // Parse phone to extract country code and local number for display
          const phoneMatch = verifiedPhone.match(/^(\+\d{1,4})(.+)$/);
          if (phoneMatch) {
            const [, countryCode, localNumber] = phoneMatch;
            const country = countries.find(c => c.phoneCode === countryCode);
            if (country) {
              setSelectedCountryCode(country.code);
              setFormattedPhoneNumber(localNumber);
            }
          }
          // Don't update originalPhoneNo yet - that will be updated after "Update Details"
        } else {
          // Email is verified - otpTarget has the verified email
          setEmail(otpTarget); // Store verified email in input field
          setEmailVerified(true);
          // Don't update originalEmail yet - that will be updated after "Update Details"
        }
        
        // Close OTP sheet after delay
        setTimeout(() => {
          setOtpSheetVisible(false);
          setOtpDigits(['', '', '', '', '', '']);
          setOtpError('');
          setOtpVerified(false);
        }, 1500);
      } else {
        setOtpError(response.message || 'Incorrect OTP. Please try again.');
        setOtpDigits(['', '', '', '', '', '']);
      }
    } catch (error: unknown) {
      const { authService } = await import('../services/authService');
      const friendly = authService.handleAuthError?.(error as Error);
      if (friendly) {
        setOtpError(friendly);
      } else if (error?.code === 'INVALID_OTP') {
        setOtpError('Incorrect OTP');
      } else if (error?.code === 'OTP_EXPIRED') {
        setOtpError('OTP expired. Please request a new one.');
      } else {
        setOtpError(error?.message || 'Failed to verify OTP');
      }
      setOtpDigits(['', '', '', '', '', '']);
    } finally {
      setOtpBusy(false);
    }
  }, [otpBusy, otpDigits, otpTarget, otpMode]);

  // Auto-verify OTP when 6 digits entered
  useEffect(() => {
    const code = otpDigits.join('');
    if (code.length === 6 && !otpBusy && !otpVerified && otpSheetVisible) {
      handleVerifyOtp();
    }
  }, [otpDigits.join(''), otpBusy, otpVerified, otpSheetVisible, handleVerifyOtp]);

  // Resend OTP
  const handleResendOtp = async () => {
    if (otpBusy || resendRemaining > 0) return;
    try {
      await Haptics.selectionAsync();
      const { authService } = await import('../services/authService');
      const response = await authService.resendOtp({ identifier: otpTarget });
      
      if (response.success) {
        setResendRemaining(30);
        setOtpError('');
        setOtpDigits(['', '', '', '', '', '']);
      } else {
        const retryAfter = Number(response?.data?.retry_after || response?.data?.retryAfter || 30);
        setResendRemaining(retryAfter);
        setOtpError(`Too many requests. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`);
      }
    } catch (error: unknown) {
      const errorObj = error as { message?: string } | undefined;
      setOtpError(errorObj?.message || 'Failed to resend OTP');
    }
  };

  useEffect(() => {
    (async () => {
      setLoadingProfile(true);
      try {
        const { authService } = await import('../services/authService');
        const { apiService } = await import('../services/api');
        
        // Fetch fresh user data from API to ensure we have latest careerLevel and roleType
        const profileResponse = await authService.getProfileFromAPI();
        console.log('📊 Profile API Response:', JSON.stringify(profileResponse, null, 2));
        
        if (profileResponse.success && profileResponse.data) {
          const user = profileResponse.data;
          console.log('👤 User data:', {
            careerLevelId: user.careerLevelId,
            careerLevel: user.careerLevel,
            roleTypeId: user.roleTypeId,
            roleType: user.roleType
          });
          
          if (user.name) setName(user.name);
          if (user.email) setEmail(user.email);
          if (user.phoneNo) setPhoneNo(user.phoneNo);
          // Store original values to detect changes
          if (user.name) setOriginalName(user.name);
          if (user.phoneNo) setOriginalPhoneNo(user.phoneNo);
          if (user.email) setOriginalEmail(user.email);
          // Mark as verified if they exist (assuming existing values are verified)
          setPhoneVerified(!!user.phoneNo);
          setEmailVerified(!!user.email);
          
          // Set Career Level
          if (user.careerLevel) {
            setCareerLevelId(user.careerLevel.id);
            setCareerLevelName(user.careerLevel.name);
            setOriginalCareerLevelId(user.careerLevel.id);
          } else if (user.careerLevelId) {
            // If only ID is present, try to get name from cached data or fetch from API
            const cachedUser = await authService.getUserData();
            if (cachedUser?.careerLevel?.id === user.careerLevelId) {
              setCareerLevelId(user.careerLevelId);
              setCareerLevelName(cachedUser.careerLevel.name);
            } else {
              // Try to fetch career level name from API
              try {
                const clResponse = await apiService.get('/career-levels');
                if (clResponse?.success && Array.isArray(clResponse.data)) {
                  const cl = clResponse.data.find((c: { id: string; name: string }) => c.id === user.careerLevelId);
                  if (cl) {
                    setCareerLevelId(user.careerLevelId);
                    setCareerLevelName(cl.name);
                    setOriginalCareerLevelId(user.careerLevelId);
                  } else {
                    setCareerLevelId(user.careerLevelId);
                    setCareerLevelName('');
                    setOriginalCareerLevelId(user.careerLevelId);
                  }
                } else {
                  setCareerLevelId(user.careerLevelId);
                  setCareerLevelName('');
                  setOriginalCareerLevelId(user.careerLevelId);
                }
              } catch {
                setCareerLevelId(user.careerLevelId);
                setCareerLevelName('');
                setOriginalCareerLevelId(user.careerLevelId);
              }
            }
          } else {
            setOriginalCareerLevelId(null);
          }
          
          // Set Role Type
          if (user.roleType) {
            setRoleTypeId(user.roleType.id);
            setRoleTypeName(user.roleType.name);
            setOriginalRoleTypeId(user.roleType.id);
          } else if (user.roleTypeId) {
            // If only ID is present, try to get name from cached data or fetch from API
            const cachedUser = await authService.getUserData();
            if (cachedUser?.roleType?.id === user.roleTypeId) {
              setRoleTypeId(user.roleTypeId);
              setRoleTypeName(cachedUser.roleType.name);
            } else {
              // Try to fetch role type name from API
              try {
                const rtResponse = await apiService.get('/role-types');
                if (rtResponse?.success && Array.isArray(rtResponse.data)) {
                  const rt = rtResponse.data.find((r: { id: string; name: string }) => r.id === user.roleTypeId);
                  if (rt) {
                    setRoleTypeId(user.roleTypeId);
                    setRoleTypeName(rt.name);
                    setOriginalRoleTypeId(user.roleTypeId);
                  } else {
                    setRoleTypeId(user.roleTypeId);
                    setRoleTypeName('');
                    setOriginalRoleTypeId(user.roleTypeId);
                  }
                } else {
                  setRoleTypeId(user.roleTypeId);
                  setRoleTypeName('');
                  setOriginalRoleTypeId(user.roleTypeId);
                }
              } catch {
                setRoleTypeId(user.roleTypeId);
                setRoleTypeName('');
                setOriginalRoleTypeId(user.roleTypeId);
              }
            }
          } else {
            setOriginalRoleTypeId(null);
          }
        } else {
          // Fallback to cached data if API fails
          const user = await authService.getUserData();
          if (user) {
            if (user.name) setName(user.name);
            if (user.email) setEmail(user.email);
            if (user.phoneNo) setPhoneNo(user.phoneNo);
            // Store original values
            if (user.name) setOriginalName(user.name);
            if (user.phoneNo) setOriginalPhoneNo(user.phoneNo);
            if (user.email) setOriginalEmail(user.email);
            setPhoneVerified(!!user.phoneNo);
            setEmailVerified(!!user.email);
            if (user.careerLevel) {
              setCareerLevelId(user.careerLevel.id);
              setCareerLevelName(user.careerLevel.name);
              setOriginalCareerLevelId(user.careerLevel.id);
            } else {
              setOriginalCareerLevelId(user.careerLevelId || null);
            }
            if (user.roleType) {
              const rt = user.roleType;
              if (typeof rt === 'object' && rt?.id) {
                setRoleTypeId(rt.id);
                if (rt.name) setRoleTypeName(rt.name);
                setOriginalRoleTypeId(rt.id);
              } else {
                setOriginalRoleTypeId(user.roleTypeId || null);
              }
            } else {
              setOriginalRoleTypeId(user.roleTypeId || null);
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        // Fallback to cached data
        try {
          const { authService } = await import('../services/authService');
          const user = await authService.getUserData();
          if (user) {
            if (user.name) setName(user.name);
            if (user.email) setEmail(user.email);
            if (user.phoneNo) setPhoneNo(user.phoneNo);
            // Store original values
            if (user.name) setOriginalName(user.name);
            if (user.phoneNo) setOriginalPhoneNo(user.phoneNo);
            if (user.email) setOriginalEmail(user.email);
            setPhoneVerified(!!user.phoneNo);
            setEmailVerified(!!user.email);
            if (user.careerLevel) {
              setCareerLevelId(user.careerLevel.id);
              setCareerLevelName(user.careerLevel.name);
              setOriginalCareerLevelId(user.careerLevel.id);
            } else {
              setOriginalCareerLevelId(user.careerLevelId || null);
            }
            if (user.roleType) {
              const rt = user.roleType;
              if (typeof rt === 'object' && rt?.id) {
                setRoleTypeId(rt.id);
                if (rt.name) setRoleTypeName(rt.name);
                setOriginalRoleTypeId(rt.id);
              } else {
                setOriginalRoleTypeId(user.roleTypeId || null);
              }
            } else {
              setOriginalRoleTypeId(user.roleTypeId || null);
            }
          }
        } catch {}
      }
      
      // Load career levels and role types for dropdowns
      try {
        const { apiService } = await import('../services/api');
        setLoadingCL(true);
        setLoadingRT(true);
        const [clResponse, rtResponse] = await Promise.all([
          apiService.get('/career-levels'),
          apiService.get('/role-types')
        ]);
        
        if (clResponse?.success && Array.isArray(clResponse.data)) {
          setCareerLevels(clResponse.data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
        }
        if (rtResponse?.success && Array.isArray(rtResponse.data)) {
          setRoleTypes(rtResponse.data.map((r: { id: string; name: string }) => ({ id: r.id, name: r.name })));
        }
      } catch (error) {
        console.error('Error loading dropdown data:', error);
      } finally {
        setLoadingCL(false);
        setLoadingRT(false);
        setLoadingProfile(false);
      }
    })();
  }, []);

  // Check if any field has changed
  const hasChanges = useMemo(() => {
    // Name changed
    if (name.trim() !== originalName.trim()) {
      return true;
    }
    
    // Career Level changed
    if (careerLevelId !== originalCareerLevelId) {
      return true;
    }
    
    // Role Type changed
    if (roleTypeId !== originalRoleTypeId) {
      return true;
    }
    
    // Phone changed (only if verified or not changed from original)
    if (phoneVerified && isEditingPhone && internationalPhone && internationalPhone !== originalPhoneNo) {
      return true;
    }
    
    // Email changed (only if verified or not changed from original)
    if (emailVerified && emailChanged && email.trim() && email.trim().toLowerCase() !== originalEmail.toLowerCase()) {
      return true;
    }
    
    return false;
  }, [name, originalName, careerLevelId, originalCareerLevelId, roleTypeId, originalRoleTypeId, phoneVerified, isEditingPhone, internationalPhone, originalPhoneNo, emailVerified, emailChanged, email, originalEmail]);

  const canSave = useMemo(() => {
    // Name must be valid (at least 2 characters)
    if (name.trim().length < 2) {
      return false;
    }
    
    // At least one field must have changed
    return hasChanges;
  }, [name, hasChanges]);

  const handleCareerLevelSelect = (item: { id: string; name: string }) => {
    setCareerLevelId(item.id);
    setCareerLevelName(item.name);
    setShowCLPicker(false);
  };

  const handleRoleTypeSelect = (item: { id: string; name: string }) => {
    setRoleTypeId(item.id);
    setRoleTypeName(item.name);
    setShowRTPicker(false);
  };

  // Handle logout
  const handleLogout = () => {
    const performLogout = async () => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await logout();
        router.replace('/auth/login');
      } catch (error) {
        console.error('❌ Logout error:', error);
        Alert.alert('Logout Failed', 'Failed to logout. Please try again.');
      }
    };

    // Show confirmation dialog
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!canSave || busy) return;

    // Show confirmation alert
    Alert.alert(
      'Confirm Update',
      'Are you sure you want to make the editions?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {}
        },
        {
          text: 'Yes',
          style: 'default',
          onPress: async () => {
            try {
              setBusy(true);
              const { authService } = await import('../services/authService');
              
              // Prepare update payload - only include changed fields, validate no null values
              const updatePayload: Record<string, unknown> = {};

              // Name - validate: must be at least 2 characters
              if (!name || name.trim().length < 2) {
                Alert.alert('Validation Error', 'Name must be at least 2 characters');
                setBusy(false);
                return;
              }
              updatePayload.name = name.trim();

              // Career Level - validate: must have a value if provided
              if (careerLevelId) {
                updatePayload.careerLevelId = careerLevelId;
              }

              // Role Type - validate: must have a value if provided
              if (roleTypeId) {
                updatePayload.roleType = roleTypeId;
              }

              // Handle phone number - validate: must be verified and not empty
              if (phoneVerified && isEditingPhone && internationalPhone) {
                // Phone was verified via OTP - use the verified phone from input
                if (!internationalPhone || internationalPhone.trim().length === 0) {
                  Alert.alert('Validation Error', 'Phone number cannot be empty');
                  setBusy(false);
                  return;
                }
                updatePayload.phoneNo = internationalPhone;
              } else if (phoneNo && !isEditingPhone && !phoneVerified) {
                // Phone wasn't changed and not verified, keep existing (only if not empty)
                if (phoneNo.trim().length > 0) {
                  updatePayload.phoneNo = phoneNo;
                }
              }
              // Don't update phone if changed but not verified

              // Handle email - validate: must be verified and valid format
              if (emailVerified && emailChanged && email.trim()) {
                // Email was verified via OTP - validate format
                const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                if (!emailRegex.test(email.trim())) {
                  Alert.alert('Validation Error', 'Please enter a valid email address');
                  setBusy(false);
                  return;
                }
                updatePayload.email = email.trim();
              } else if (email && !emailChanged && !emailVerified) {
                // Email wasn't changed and not verified, keep existing (only if valid)
                if (email.trim().length > 0) {
                  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                  if (!emailRegex.test(email.trim())) {
                    Alert.alert('Validation Error', 'Please enter a valid email address');
                    setBusy(false);
                    return;
                  }
                  updatePayload.email = email.trim();
                }
              }
              // Don't update email if changed but not verified
              
              await authService.updateProfileViaAPI(updatePayload);
              
              // Refresh user data from backend after successful update
              const profileResponse = await authService.getProfileFromAPI();
              if (profileResponse.success && profileResponse.data) {
                const user = profileResponse.data;
                if (user.name) setName(user.name);
                if (user.email) setEmail(user.email);
                if (user.phoneNo) setPhoneNo(user.phoneNo);
                // Update original values after successful save
                if (user.name) setOriginalName(user.name);
                if (user.phoneNo) setOriginalPhoneNo(user.phoneNo);
                if (user.email) setOriginalEmail(user.email);
                setPhoneVerified(!!user.phoneNo);
                setEmailVerified(!!user.email);
                // Update original career level and role type
                if (user.careerLevel) {
                  setOriginalCareerLevelId(user.careerLevel.id);
                } else {
                  setOriginalCareerLevelId(user.careerLevelId || null);
                }
                if (user.roleType) {
                  const rt = user.roleType;
                  if (typeof rt === 'object' && rt?.id) {
                    setOriginalRoleTypeId(rt.id);
                  } else {
                    setOriginalRoleTypeId(user.roleTypeId || null);
                  }
                } else {
                  setOriginalRoleTypeId(user.roleTypeId || null);
                }
                
                // Exit phone edit mode if was editing
                if (isEditingPhone) {
                  setIsEditingPhone(false);
                  // Reset phone number parsing
                  const phoneMatch = user.phoneNo?.match(/^(\+\d{1,4})(.+)$/);
                  if (phoneMatch) {
                    const [, countryCode, localNumber] = phoneMatch;
                    const country = countries.find(c => c.phoneCode === countryCode);
                    if (country) {
                      setSelectedCountryCode(country.code);
                      setFormattedPhoneNumber(localNumber);
                    }
                  }
                }
              }
            } catch (e: unknown) {
              console.error('Failed to update profile:', e);
              const errorMessage = e instanceof Error ? e.message : 'Failed to update profile. Please try again.';
              Alert.alert('Update Failed', errorMessage);
            } finally {
              setBusy(false);
            }
          }
        }
      ]
    );
  };

  // Show shimmer while loading
  if (loadingProfile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <StatusBar barStyle="light-content" />
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="light-content" />

      {/* Header - match careerRole/skills layout */}
      <View style={{ paddingVertical: 16, paddingHorizontal: width * 0.06, borderBottomWidth: 1.5, borderBottomColor: '#D1D5DB', marginHorizontal: -(width * 0.06), backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.replace('/dashboard')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AntDesign name="left" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: width * 0.048, fontWeight: '700', color: '#0F172A', marginRight: 20 }}>Your Profile</Text>
      </View>

      {/* Body - same background as skills/careerRole */}
      <View style={{ flex: 1, backgroundColor: '#F3F4F6', marginHorizontal: -(width * 0.06), paddingHorizontal: width * 0.06 }}>
        <View style={{ paddingTop: 0, paddingBottom: 80 }}>

          {/* Profile Card */}
          <View style={styles.card}>
            {/* Avatar */}
            <View style={{ alignItems: 'center', marginTop: -40, marginBottom: 8 }}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            </View>

            {/* Name */}
            <View style={{ width: '100%', marginBottom: 8 }}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                mode="outlined"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                style={styles.input}
                textColor="#333333"
                placeholderTextColor="#999999"
                outlineColor="#e9ecef"
                activeOutlineColor={BRAND}
                contentStyle={{ fontSize: 16, paddingVertical: 0, fontWeight: '700' }}
                theme={{ colors: { onSurfaceVariant: '#666666' }, roundness: 12 }}
              />
            </View>

            {/* Phone */}
            <View style={{ width: '100%', marginBottom: 8 }}>
              <Text style={styles.label}>Mobile</Text>
              {!isEditingPhone ? (
                <>
                  <TouchableOpacity 
                    activeOpacity={0.85} 
                    onPress={() => setIsEditingPhone(true)}
                  >
                    <TextInput
                      mode="outlined"
                      value={phoneNo}
                      placeholder={!phoneNo ? "Please enter your phone number" : undefined}
                      editable={false}
                      right={
                        phoneVerified && phoneNo ? (
                          <TextInput.Affix text="Verified!" textStyle={{ color: '#16A34A', fontWeight: '700', fontSize: 13 }} />
                        ) : undefined
                      }
                      style={styles.input}
                      textColor="#333333"
                      placeholderTextColor="#999999"
                      outlineColor="#e9ecef"
                      activeOutlineColor={BRAND}
                      contentStyle={{ fontSize: 16, paddingVertical: 0, fontWeight: '700' }}
                      theme={{ colors: { onSurfaceVariant: '#666666' }, roundness: 12 }}
                    />
                  </TouchableOpacity>
                  {phoneValidationError ? (
                    <View style={{ width: '100%', marginTop: 2, marginBottom: 8 }}>
                      <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '700' }}>
                        * {phoneValidationError}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable 
                      onPress={() => setCountryPickerVisible(true)}
                      style={{ width: 60 }}
                    >
                      <View style={styles.countryPickerButton}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {selectedPhoneCountry.flag ? (
                            <Image 
                              source={{ uri: getConvertedFlagUrl(selectedPhoneCountry.flag) }}
                              style={{ width: 18, height: 12, marginRight: 6 }}
                            />
                          ) : (
                            <View style={{ width: 20, height: 14, marginRight: 6, backgroundColor: '#e9ecef', borderRadius: 2 }} />
                          )}
                          <AntDesign name="down" size={12} color="#6B7280" />
                        </View>
                      </View>
                    </Pressable>

                    <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        mode="outlined"
                        placeholder="Enter Phone Number"
                        value={formattedPhoneNumber}
                        onChangeText={setFormattedPhoneNumber}
                        keyboardType="phone-pad"
                        maxLength={15}
                        style={[styles.input, { flex: 1 }]}
                        textColor="#333333"
                        placeholderTextColor="#999999"
                        outlineColor="#e9ecef"
                        activeOutlineColor={BRAND}
                        contentStyle={{ 
                          fontSize: 16, 
                          paddingVertical: 0, 
                          fontWeight: '700',
                          textAlignVertical: 'center'
                        }}
                        theme={{ colors: { onSurfaceVariant: '#666666' }, roundness: 12 }}
                        left={<TextInput.Icon icon={() => (
                          <Text style={{ color: '#111827', fontWeight: '700', fontSize: 16 }}>
                            {`${selectedPhoneCountry.phoneCode} `}
                          </Text>
                        )} />}
                        right={
                          phoneChanged && phoneValid && !phoneVerified ? (
                            <TextInput.Affix 
                              text="Verify" 
                              textStyle={{ color: BRAND, fontWeight: '700', fontSize: 13 }} 
                              onPress={handleSendPhoneOtp}
                            />
                          ) : phoneVerified ? (
                            <TextInput.Affix 
                              text="Verified!" 
                              textStyle={{ color: '#16A34A', fontWeight: '700', fontSize: 13 }} 
                            />
                          ) : undefined
                        }
                      />
                      <TouchableOpacity
                        onPress={() => {
                          setIsEditingPhone(false);
                          // Reset to original phone number
                          const phoneMatch = phoneNo.match(/^(\+\d{1,4})(.+)$/);
                          if (phoneMatch) {
                            const [, countryCode, localNumber] = phoneMatch;
                            const country = countries.find(c => c.phoneCode === countryCode);
                            if (country) {
                              setSelectedCountryCode(country.code);
                              setFormattedPhoneNumber(localNumber);
                            }
                          } else {
                            setFormattedPhoneNumber(phoneNo.replace(/^\+91/, ''));
                          }
                        }}
                        style={styles.cancelButton}
                      >
                        <AntDesign name="close" size={18} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {phoneValidationError && isEditingPhone ? (
                    <View style={{ width: '100%', marginTop: 2, marginBottom: 8 }}>
                      <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '700' }}>
                        * {phoneValidationError}
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>

            {/* Email */}
            <View style={{ width: '100%', marginBottom: 8 }}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                mode="outlined"
                value={email}
                placeholder={!email ? "Please enter your email id" : undefined}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                textColor="#333333"
                placeholderTextColor="#999999"
                outlineColor="#e9ecef"
                activeOutlineColor={BRAND}
                contentStyle={{ fontSize: 16, paddingVertical: 0, fontWeight: '700' }}
                theme={{ colors: { onSurfaceVariant: '#666666' }, roundness: 12 }}
                right={
                  emailChanged && emailValid && !emailVerified ? (
                    <TextInput.Affix 
                      text="Verify" 
                      textStyle={{ color: BRAND, fontWeight: '700', fontSize: 13 }} 
                      onPress={handleSendEmailOtp}
                    />
                  ) : emailVerified && email ? (
                    <TextInput.Affix 
                      text="Verified!" 
                      textStyle={{ color: '#16A34A', fontWeight: '700', fontSize: 13 }} 
                    />
                  ) : undefined
                }
              />
              {emailValidationError ? (
                <View style={{ width: '100%', marginTop: 2, marginBottom: 8 }}>
                  <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '700' }}>
                    * {emailValidationError}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Career Level */}
            <View style={{ width: '100%', marginBottom: 8 }}>
              <Text style={styles.label}>Career Level</Text>
              <TouchableOpacity activeOpacity={0.85} onPress={() => setShowCLPicker(true)}>
                <View style={styles.selectInput}>
                  <Text style={styles.selectValue}>{careerLevelName || 'Select career level'}</Text>
                  <AntDesign name="down" size={14} color="#6B7280" />
                </View>
              </TouchableOpacity>
              <Text style={[styles.warningText, { marginTop: 4 }]}>
                * Updating the career level will remove the current level's skill selection and this action cannot be undone. Please update the level keeping this in mind.
              </Text>
            </View>

            {/* Career Role (Role Type) */}
            <View style={{ width: '100%', marginBottom: 8 }}>
              <Text style={styles.label}>Career Role</Text>
              <TouchableOpacity activeOpacity={0.85} onPress={() => setShowRTPicker(true)}>
                <View style={styles.selectInput}>
                  <Text style={styles.selectValue}>{roleTypeName || 'Select career role'}</Text>
                  <AntDesign name="down" size={14} color="#6B7280" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Button */}
          <View style={{ width: '100%', marginTop: 8, marginBottom: 0, paddingHorizontal: width * 0.06 }}>
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#b23b3b',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 12,
                borderWidth: 0,
                opacity: 0.9
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sticky footer - same as continue button style */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: width * 0.06, paddingTop: 12, paddingBottom: 12, zIndex: 1000, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#D1D5DB' }}>
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={!canSave || busy}
            style={{ backgroundColor: BRAND, borderRadius: 22, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginHorizontal: 6, opacity: (!canSave || busy) ? 0.6 : 1, flexDirection: 'row', gap: 8 }}
          >
            {busy ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={{ color: '#fff', fontSize: width * 0.038, fontWeight: '600' }}>Updating...</Text>
              </>
            ) : (
              <Text style={{ color: '#fff', fontSize: width * 0.038, fontWeight: '600' }}>Update Details</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <BottomNavigation activeTab="profile" />

      {/* Career Level Picker Modal */}
      <PickerModal
        visible={showCLPicker}
        title="Select Career Level"
        items={careerLevels}
        selectedId={careerLevelId}
        loading={loadingCL}
        onClose={() => setShowCLPicker(false)}
        onSelect={handleCareerLevelSelect}
      />

      {/* Role Type Picker Modal */}
      <PickerModal
        visible={showRTPicker}
        title="Select Career Role"
        items={roleTypes}
        selectedId={roleTypeId}
        loading={loadingRT}
        onClose={() => setShowRTPicker(false)}
        onSelect={handleRoleTypeSelect}
      />

      {/* Country Picker Modal */}
      <CountryPickerModal
        visible={countryPickerVisible}
        onClose={() => setCountryPickerVisible(false)}
        onSelect={(country) => {
          setSelectedCountryCode(country.code);
          setCountryPickerVisible(false);
        }}
      />

      {/* OTP Verification Sheet */}
      {otpSheetVisible && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'flex-end' }}>
          <Pressable
            onPress={() => { if (!otpBusy) setOtpSheetVisible(false); }}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }}
          />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 40}>
            <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', marginBottom: 12 }} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>Verify your {otpMode === 'phone' ? 'phone number' : 'email'}</Text>
              <Text style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>
                We've sent a verification code to {otpMode === 'phone' ? otpTarget.replace(/(\d{2})\d+(\d{4})/, '+$1***$2') : otpTarget.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
              </Text>

              <View style={{ marginTop: 16, paddingBottom: 28 }}>
                <CodeBoxes
                  length={6}
                  value={otpDigits}
                  onChange={(v) => { if (!otpVerified) setOtpDigits(v); }}
                  color={otpError ? '#DC2626' : otpVerified ? '#16A34A' : BRAND}
                  error={!!otpError}
                />
                <View style={{ minHeight: 24, justifyContent: 'center' }}>
                  {otpError ? (
                    <Text style={{ color: '#DC2626', marginTop: 10, textAlign: 'center', fontWeight: '700' }}>{otpError}</Text>
                  ) : otpVerified ? (
                    <Text style={{ color: '#16A34A', marginTop: 10, textAlign: 'center', fontWeight: '800' }}>Verified!</Text>
                  ) : null}
                </View>
                {/* Resend */}
                <View style={{ alignItems: 'center', marginTop: 6 }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>
                    Code not received?{' '}
                    <Text onPress={handleResendOtp} style={{ color: resendRemaining > 0 ? '#9CA3AF' : BRAND, fontWeight: '800', textDecorationLine: 'underline' }}>
                      {resendRemaining > 0 ? `Resend in ${resendRemaining}s` : 'Resend'}
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, color: '#666666', marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: '#f8f9fa', height: 56 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 22, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  avatarCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#374151', borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4, overflow: 'hidden' },
  avatarInitial: { fontSize: 36, fontWeight: '800', color: '#FFFFFF' },
  selectInput: { backgroundColor: '#f8f9fa', height: 56, borderWidth: 1, borderColor: '#e9ecef', borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  selectValue: { color: '#0F172A', fontSize: 16, fontWeight: '700', flex: 1 },
  warningText: { fontSize: 12, color: '#F59E0B', marginTop: 6, lineHeight: 16, fontWeight: '500' },
  countryPickerButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cancelButton: {
    width: 56,
    height: 56,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Reusable Picker Modal Component
function PickerModal({ visible, title, items, selectedId, loading, onClose, onSelect }: {
  visible: boolean;
  title: string;
  items: Array<{ id: string; name: string }>;
  selectedId: string | null;
  loading: boolean;
  onClose: () => void;
  onSelect: (item: { id: string; name: string }) => void;
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={pickerStyles.modalOverlay}>
        <TouchableOpacity style={pickerStyles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={pickerStyles.modalContent}>
          {/* Header */}
          <View style={pickerStyles.modalHeader}>
            <Text style={pickerStyles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <AntDesign name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* List */}
          {loading ? (
            <View style={pickerStyles.loadingContainer}>
              <Text style={pickerStyles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedId;
                return (
                  <TouchableOpacity
                    style={pickerStyles.item}
                    onPress={() => onSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={pickerStyles.itemText}>
                      {item.name}
                    </Text>
                    <View style={pickerStyles.radioContainer}>
                      <View style={[pickerStyles.radioOuter, isSelected && pickerStyles.radioOuterSelected]}>
                        {isSelected && <View style={pickerStyles.radioInner} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={pickerStyles.separator} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={pickerStyles.listContent}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  listContent: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  itemText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  radioContainer: {
    marginLeft: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioOuterSelected: {
    borderColor: BRAND,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 20,
  },
});


