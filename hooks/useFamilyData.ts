'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Person, Relationship } from '@/types';

interface UseFamilyDataOptions {
  autoLoad?: boolean;
}

interface UseFamilyDataReturn {
  persons: Person[];
  relationships: Relationship[];
  loading: boolean;
  error: string | null;
  loadData: () => Promise<void>;
  clearData: () => void;
}

// Global cache for family data
let familyDataCache: { persons: Person[]; relationships: Relationship[]; timestamp: number } | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

export function useFamilyData(options: UseFamilyDataOptions = {}): UseFamilyDataReturn {
  const { autoLoad = false } = options;
  
  const [persons, setPersons] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first
      if (familyDataCache && isCacheValid(familyDataCache.timestamp)) {
        console.log('Using cached family data');
        setPersons(familyDataCache.persons);
        setRelationships(familyDataCache.relationships);
        setLoading(false);
        return;
      }

      console.log('Loading family data from database');
      const startTime = performance.now();
      
      const supabase = createClient();
      
      // Load persons
      const { data: allPersons, error: personsError } = await supabase
        .from("persons")
        .select("id, full_name, gender, birth_year, birth_month, birth_day, death_year, death_month, death_day, avatar_url, note, created_at, updated_at, is_deceased, is_in_law, is_notable, birth_order, generation, branch_id, other_names")
        .order("birth_year", { ascending: true, nullsFirst: false });

      if (personsError) throw new Error(personsError.message);

      // Load relationships
      const { data: relsData, error: relationshipsError } = await supabase
        .from("relationships")
        .select("id, type, person_a, person_b, note, created_at, updated_at");

      if (relationshipsError) throw new Error(relationshipsError.message);

      const endTime = performance.now();
      console.log(`Family data loaded in ${endTime - startTime}ms`);

      // Update cache
      familyDataCache = {
        persons: allPersons || [],
        relationships: relsData || [],
        timestamp: Date.now()
      };

      setPersons(allPersons || []);
      setRelationships(relsData || []);
    } catch (err: any) {
      console.error('Error loading family data:', err);
      setError(err.message);
      setPersons([]);
      setRelationships([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    familyDataCache = null;
    setPersons([]);
    setRelationships([]);
    setError(null);
  }, []);

  // Auto-load if enabled
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  return {
    persons,
    relationships,
    loading,
    error,
    loadData,
    clearData
  };
}
