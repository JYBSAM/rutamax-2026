import { supabase } from './supabaseClient';
import { Truck, Trip, User, Role, Driver, Tariff } from '../types';

class SupabaseService {
  // Generic CRUD filtered by companyId
  // Helper to map camelCase to snake_case
  private toSnakeCase(obj: any) {
    const snakeObj: any = {};
    for (const key in obj) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      snakeObj[snakeKey] = obj[key];
    }
    return snakeObj;
  }

  // Helper to map snake_case to camelCase
  private toCamelCase(obj: any) {
    const camelObj: any = {};
    for (const key in obj) {
      const camelKey = key.replace(/(_\w)/g, m => m[1].toUpperCase());
      camelObj[camelKey] = obj[key];
    }
    return camelObj;
  }

  async getItems<T>(table: string, companyId?: string): Promise<T[]> {
    let query = supabase.from(table).select('*');
    
    if (companyId && companyId !== 'all') {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error fetching from ${table}:`, error);
      return [];
    }
    return data.map(item => this.toCamelCase(item)) as T[];
  }

  async addItem<T>(table: string, item: any): Promise<T> {
    const snakeItem = this.toSnakeCase(item);
    const { data, error } = await supabase
      .from(table)
      .insert([snakeItem])
      .select()
      .single();
    
    if (error) {
      console.error(`Error adding to ${table}:`, error);
      console.error('Item attempted:', snakeItem);
      throw error;
    }
    return this.toCamelCase(data) as T;
  }

  async updateItem<T>(table: string, id: string, updates: any): Promise<T> {
    const snakeUpdates = this.toSnakeCase(updates);
    const { data, error } = await supabase
      .from(table)
      .update(snakeUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating ${table}:`, error);
      throw error;
    }
    return this.toCamelCase(data) as T;
  }

  async deleteItem(table: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting from ${table}:`, error);
      return false;
    }
    return true;
  }

  // Specialized methods
  async getItem<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching item from ${table}:`, error);
      return null;
    }
    return this.toCamelCase(data) as T;
  }

  async getTripsForDriver(driverId: string, companyId: string): Promise<Trip[]> {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('driver_id', driverId)
      .eq('company_id', companyId);
    
    if (error) {
      console.error('Error fetching trips for driver:', error);
      return [];
    }
    return data as Trip[];
  }

  // Auth helper
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle to avoid errors if not found
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  }

  async upsertProfile(profile: any) {
    const snakeProfile = this.toSnakeCase(profile);
    const { data, error } = await supabase
      .from('profiles')
      .upsert(snakeProfile)
      .select()
      .single();
    
    if (error) {
      console.error('Error upserting profile:', error);
      throw error;
    }
    return data;
  }

  async penalizeDriver(driverId: string, companyId: string, points: number, reason: string) {
    const driver = await this.getItem<any>('drivers', driverId);
    if (!driver) return false;
    
    const currentPoints = driver.safetyPoints || 100;
    const newPoints = Math.max(0, currentPoints - points);
    
    return this.updateItem('drivers', driverId, { 
      safetyPoints: newPoints,
      lastPenaltyReason: reason,
      lastPenaltyDate: new Date().toISOString()
    });
  }
}

export const supabaseService = new SupabaseService();
