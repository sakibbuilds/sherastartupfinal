import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

export const AdBanner = () => {
  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    fetchAd();
  }, []);

  const fetchAd = async () => {
    const { data } = await supabase
      .from('advertisements')
      .select('*')
      .eq('active', true)
      .limit(1)
      .maybeSingle(); // Just get one for now. Could be random.

    if (data) setAd(data);
  };

  if (!ad) return null;

  return (
    <Card className="overflow-hidden border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="relative group">
          <p className="text-[10px] text-muted-foreground mb-1">Sponsored</p>
          <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="block relative rounded-lg overflow-hidden">
             <img 
               src={ad.image_url} 
               alt="Advertisement" 
               className="w-full h-auto object-cover hover:opacity-95 transition-opacity"
             />
             <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
               <ExternalLink className="h-3 w-3" />
             </div>
          </a>
          {ad.title && (
             <p className="text-xs font-medium mt-1">{ad.title}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
