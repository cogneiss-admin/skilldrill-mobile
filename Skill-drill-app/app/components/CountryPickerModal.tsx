// @ts-nocheck
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Image, Dimensions, TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useCountries } from '../../hooks/useCountries';

interface CountryPickerModalProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onSelect: (country: { code: string; name: string; phoneCode: string; flag?: string | null }) => void;
  showPhoneCode?: boolean;
}

const { width } = Dimensions.get('window');

const CountryPickerModal: React.FC<CountryPickerModalProps> = ({ visible, title = 'Select Country Code', onClose, onSelect, showPhoneCode = true }) => {
  const { countries, loading: countriesLoading } = useCountries();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phoneCode.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  }, [countries, search]);

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#fff' }}>
      {/* Top bar with back */}
      <View style={{ paddingLeft: 6, paddingRight: 6, paddingTop: 16, paddingBottom: 4 }}>
        <TouchableOpacity onPress={() => { setSearch(''); onClose(); }} style={{ padding: 8, alignSelf: 'flex-start' }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AntDesign name="left" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Search Bar full width below back with small side gutters and radius */}
      <View style={{ paddingHorizontal: Math.max(8, Math.round(width * 0.03)), paddingBottom: 6 }}>
        <View style={{ width: '100%', backgroundColor: '#f5f5f5', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 46 }}>
          <AntDesign name="search" size={18} color="#999" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search by country name..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, fontSize: Math.max(13, Math.round(width * 0.038)), color: '#333', paddingVertical: 0 }}
          />
        </View>
      </View>

      {/* Section title under search */}
      <View style={{ paddingHorizontal: Math.max(10, Math.round(width * 0.06)), paddingBottom: 6 }}>
        <Text style={{ fontSize: Math.max(14, Math.round(width * 0.038)), color: '#222', fontWeight: '500' }}>Select your country</Text>
      </View>

      {/* List */}
      {countriesLoading ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#666' }}>Loading countries...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => {
            // Prefer PNG for RN
            const flagPng = item.flag ? item.flag.replace('.svg', '.png').replace('flagcdn.com/', 'flagcdn.com/w40/') : null;
            const baseFont = Math.max(14, Math.round(width * 0.038));
            return (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: width * 0.06 }}
                onPress={() => { onSelect(item); setSearch(''); onClose(); }}
                activeOpacity={0.7}
              >
                <View style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', marginRight: 12, backgroundColor: '#eee' }}>
                  {flagPng ? (
                    <Image source={{ uri: flagPng }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : null}
                </View>
                <Text style={{ fontSize: baseFont, color: '#222', flex: 1 }} numberOfLines={1}>
                  {item.name}
                </Text>
                {showPhoneCode ? (
                  <Text style={{ fontSize: baseFont, color: '#666', marginLeft: 10, minWidth: 56, textAlign: 'right' }}>
                    {item.phoneCode}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: '#eee', marginLeft: 46 }} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}
    </View>
  );
};

export default CountryPickerModal;


