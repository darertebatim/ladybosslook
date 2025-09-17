import React, { useState, useEffect } from 'react';
import { Search, Filter, Headphones } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { VoicePlayer } from '@/components/VoicePlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { voices, voiceCategories, Voice } from '@/data/voices';

const Voices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null);
  const [filteredVoices, setFilteredVoices] = useState<Voice[]>(voices);

  // Filter voices based on search and category
  useEffect(() => {
    let filtered = voices;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(voice => voice.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(voice => 
        voice.title.toLowerCase().includes(term) ||
        voice.titleFarsi.includes(term) ||
        voice.description.toLowerCase().includes(term) ||
        voice.descriptionFarsi.includes(term)
      );
    }

    setFilteredVoices(filtered);
  }, [searchTerm, selectedCategory]);

  const handleVoicePlay = (voiceId: string) => {
    setActiveVoiceId(prev => prev === voiceId ? null : voiceId);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEOHead
        title="Voice Recordings - Empowerment Sessions | LadyBoss Academy"
        description="Listen to powerful voice recordings on courage, leadership, and personal growth. Persian and English empowerment sessions for immigrant women."
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-hero text-primary-foreground py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
                  <Headphones className="h-12 w-12" />
                </div>
              </div>
              
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
                Voice of Empowerment
              </h1>
              <p className="font-farsi text-2xl md:text-3xl mb-4 rtl">
                صدای قدرت‌بخشی
              </p>
              
              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-4">
                Listen to powerful voice recordings designed to build your courage, 
                strengthen your leadership, and guide your personal transformation journey.
              </p>
              <p className="font-farsi text-base md:text-lg text-white/80 rtl">
                به ضبط‌های صوتی قدرتمند گوش دهید که برای ساختن شجاعت، تقویت رهبری 
                و راهنمایی در سفر تحول شخصی شما طراحی شده‌اند.
              </p>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="py-8 bg-card">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search voice recordings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap">
                  {voiceCategories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-3 w-3" />
                      <span>{category.label}</span>
                      <span className="font-farsi text-sm">({category.labelFarsi})</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Results Count */}
              <div className="text-center mb-6">
                <p className="text-muted-foreground">
                  {filteredVoices.length} voice recording{filteredVoices.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Voice Recordings Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {filteredVoices.length > 0 ? (
                <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-2">
                  {filteredVoices.map((voice) => (
                    <VoicePlayer
                      key={voice.id}
                      voice={voice}
                      isActive={activeVoiceId === voice.id}
                      onPlay={() => handleVoicePlay(voice.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-muted/50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">No recordings found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search terms or category filter.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-accent">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-accent-foreground">
                Ready for Personal Coaching?
              </h2>
              <p className="font-farsi text-xl mb-6 text-accent-foreground/80 rtl">
                آماده کوچینگ شخصی هستید؟
              </p>
              <p className="text-lg text-accent-foreground/90 mb-8">
                Take your transformation journey to the next level with personalized 
                one-on-one coaching sessions.
              </p>
              <Button size="lg" className="font-semibold">
                Book a Session
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Voices;