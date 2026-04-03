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

      // Recursive fetch function to ensure we get ALL records regardless of server limits
      async function fetchEverything(table: string) {
        let allData: any[] = [];
        let from = 0;
        let to = 999;
        const step = 1000;
        
        console.log(`Starting fetch for ${table}...`);
        
        while (true) {
          const { data, error } = await supabase
            .from(table)
            .select("*")
            .range(from, to);
            
          if (error) {
            console.error(`Error fetching ${table} at range ${from}-${to}:`, error);
            throw error;
          }
          
          if (!data || data.length === 0) break;
          
          allData = [...allData, ...data];
          console.log(`Fetched ${data.length} records from ${table}. Total: ${allData.length}`);
          
          if (data.length < step) break; // Last page
          
          from += step;
          to += step;
        }
        return allData;
      }
      
      const allPersons = await fetchEverything("persons");
      const relsData = await fetchEverything("relationships");

      const endTime = performance.now();
      console.log(`Success! Loaded ${allPersons.length} persons and ${relsData.length} relationships in ${Math.round(endTime - startTime)}ms`);

      // Update cache
      familyDataCache = {
        persons: allPersons,
        relationships: relsData,
        timestamp: Date.now()
      };

      setPersons(allPersons);
      setRelationships(relsData);
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
