-- 1. User Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Characters (The Champions)
CREATE TABLE IF NOT EXISTS characters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  class TEXT, 
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  hp_current INTEGER,
  hp_max INTEGER,
  strength INTEGER DEFAULT 10,
  dexterity INTEGER DEFAULT 10,
  intelligence INTEGER DEFAULT 10,
  wisdom INTEGER DEFAULT 10,
  charisma INTEGER DEFAULT 10,
  constitution INTEGER DEFAULT 10,
  image_url TEXT, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Active Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  adventure_title TEXT, 
  current_turn INTEGER DEFAULT 0,
  time_of_day TEXT DEFAULT 'Dawn',
  weather TEXT DEFAULT 'Clear',
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Chat Logs (AI Memory)
CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  role TEXT, 
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- Policies (using DO blocks to prevent 'already exists' errors)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own characters') THEN
        CREATE POLICY "Users can view their own characters" ON characters FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert their own characters') THEN
        CREATE POLICY "Users can insert their own characters" ON characters FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update their own characters') THEN
        CREATE POLICY "Users can update their own characters" ON characters FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete their own characters') THEN
        CREATE POLICY "Users can delete their own characters" ON characters FOR DELETE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own campaigns') THEN
        CREATE POLICY "Users can view their own campaigns" ON campaigns FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert their own campaigns') THEN
        CREATE POLICY "Users can insert their own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update their own campaigns') THEN
        CREATE POLICY "Users can update their own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete their own campaigns') THEN
        CREATE POLICY "Users can delete their own campaigns" ON campaigns FOR DELETE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view logs of their campaigns') THEN
        CREATE POLICY "Users can view logs of their campaigns" ON chat_logs FOR SELECT USING (EXISTS (
            SELECT 1 FROM campaigns WHERE campaigns.id = chat_logs.campaign_id AND campaigns.user_id = auth.uid()
        ));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert logs for their campaigns') THEN
        CREATE POLICY "Users can insert logs for their campaigns" ON chat_logs FOR INSERT WITH CHECK (EXISTS (
            SELECT 1 FROM campaigns WHERE campaigns.id = chat_logs.campaign_id AND campaigns.user_id = auth.uid()
        ));
    END IF;
END $$;

-- Automatic Profile Creation Trigger
INSERT INTO public.profiles (id, username)
SELECT id, split_part(email, '@', 1)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, split_part(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    description TEXT,
    item_type TEXT DEFAULT 'misc', -- weapon, armor, potion, material, misc
    quantity INTEGER DEFAULT 1,
    sell_value INTEGER DEFAULT 0,
    is_equipped BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view inventory of their campaigns') THEN
        CREATE POLICY "Users can view inventory of their campaigns" ON inventory FOR SELECT USING (EXISTS (
            SELECT 1 FROM campaigns WHERE campaigns.id = inventory.campaign_id AND campaigns.user_id = auth.uid()
        ));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert inventory for their campaigns') THEN
        CREATE POLICY "Users can insert inventory for their campaigns" ON inventory FOR INSERT WITH CHECK (EXISTS (
            SELECT 1 FROM campaigns WHERE campaigns.id = inventory.campaign_id AND campaigns.user_id = auth.uid()
        ));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update inventory of their campaigns') THEN
        CREATE POLICY "Users can update inventory of their campaigns" ON inventory FOR UPDATE USING (EXISTS (
            SELECT 1 FROM campaigns WHERE campaigns.id = inventory.campaign_id AND campaigns.user_id = auth.uid()
        ));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete inventory of their campaigns') THEN
        CREATE POLICY "Users can delete inventory of their campaigns" ON inventory FOR DELETE USING (EXISTS (
            SELECT 1 FROM campaigns WHERE campaigns.id = inventory.campaign_id AND campaigns.user_id = auth.uid()
        ));
    END IF;
END $$;

-- Seed starter inventory when a campaign is created
CREATE OR REPLACE FUNCTION public.seed_campaign_inventory()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.inventory (campaign_id, item_name, description, item_type, quantity, sell_value) VALUES
        (NEW.id, 'Adventurer''s Pack', 'Bedroll, rations, rope, torches', 'misc', 1, 5),
        (NEW.id, 'Waterskin', 'Filled with fresh water', 'misc', 1, 1),
        (NEW.id, 'Gold Pieces', 'Standard currency', 'misc', 15, 0),
        (NEW.id, 'Health Potion', 'Restores 2d4+2 HP', 'potion', 2, 25),
        (NEW.id, 'Herb', 'A common healing herb', 'material', 3, 2),
        (NEW.id, 'Glass Vial', 'An empty glass vial', 'material', 2, 1),
        (NEW.id, 'Iron Ore', 'Raw iron ore chunk', 'material', 4, 3),
        (NEW.id, 'Leather Strips', 'Tanned leather strips', 'material', 3, 2),
        (NEW.id, 'Wood', 'Dry firewood pieces', 'material', 3, 1),
        (NEW.id, 'Cloth', 'A strip of cloth', 'material', 2, 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_campaign_created ON campaigns;
CREATE TRIGGER on_campaign_created
  AFTER INSERT ON campaigns
  FOR EACH ROW EXECUTE PROCEDURE public.seed_campaign_inventory();
