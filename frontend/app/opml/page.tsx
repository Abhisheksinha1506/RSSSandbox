'use client';

import { useState } from 'react';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, Plus, X, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

interface OPMLFeed {
  title: string;
  xmlUrl: string;
  htmlUrl?: string;
  description?: string;
  category?: string[];
}

interface OPMLResult {
  title: string;
  feeds: OPMLFeed[];
  dateCreated: string;
  dateModified: string;
}

export default function OPMLPage() {
  const [generateUrls, setGenerateUrls] = useState<string[]>(['']);
  const [opmlContent, setOpmlContent] = useState('');
  const [generatedOPML, setGeneratedOPML] = useState<string | null>(null);
  const [parsedOPML, setParsedOPML] = useState<OPMLResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddUrl = () => {
    setGenerateUrls([...generateUrls, '']);
  };

  const handleRemoveUrl = (index: number) => {
    setGenerateUrls(generateUrls.filter((_, i) => i !== index));
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...generateUrls];
    newUrls[index] = value;
    setGenerateUrls(newUrls);
  };

  const handleGenerate = async () => {
    const validUrls = generateUrls.filter(url => url.trim()).map(url => url.trim());
    
    if (validUrls.length === 0) {
      setError('Please provide at least one feed URL');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedOPML(null);

    try {
      const response = await api.generateOPML(validUrls);
      
      if (!response.success || !response.opml) {
        setError(response.error || 'Failed to generate OPML');
        setLoading(false);
        return;
      }

      setGeneratedOPML(response.opml);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate OPML');
      setLoading(false);
    }
  };

  const handleParse = async () => {
    if (!opmlContent.trim()) {
      setError('Please provide OPML content');
      return;
    }

    setLoading(true);
    setError(null);
    setParsedOPML(null);

    try {
      const response = await api.parseOPML(opmlContent);
      
      if (!response.success || !response.data) {
        setError(response.error || 'Failed to parse OPML');
        setLoading(false);
        return;
      }

      setParsedOPML(response.data as OPMLResult);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse OPML');
      setLoading(false);
    }
  };

  const downloadOPML = (content: string, filename: string = 'feeds.opml') => {
    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setOpmlContent(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="container py-8 sm:py-12 px-4 sm:px-6 max-w-7xl">
      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          OPML Generator & Parser
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Generate OPML files from feed URLs or parse existing OPML files.
        </p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto mb-6">
          <TabsTrigger value="generate" className="text-xs sm:text-sm px-2 sm:px-3 py-2">
            <Download className="h-4 w-4 mr-2" />
            Generate OPML
          </TabsTrigger>
          <TabsTrigger value="parse" className="text-xs sm:text-sm px-2 sm:px-3 py-2">
            <Upload className="h-4 w-4 mr-2" />
            Parse OPML
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Generate OPML from Feed URLs</CardTitle>
              <CardDescription className="text-sm">
                Enter feed URLs to generate an OPML subscription file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generateUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/feed.xml"
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    disabled={loading}
                    className="flex-1 text-sm sm:text-base"
                  />
                  {generateUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveUrl(index)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddUrl}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add URL
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={loading || generateUrls.every(url => !url.trim())}
                  className="w-full sm:w-auto"
                >
                  {loading ? 'Generating...' : 'Generate OPML'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading && <LoadingState message="Generating OPML..." />}

          {generatedOPML && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-lg sm:text-xl">Generated OPML</CardTitle>
                  <Button
                    onClick={() => downloadOPML(generatedOPML)}
                    variant="default"
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download OPML
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-3 sm:p-4 bg-muted overflow-auto max-h-96">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                    {generatedOPML}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="parse" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Parse OPML File</CardTitle>
              <CardDescription className="text-sm">
                Upload an OPML file or paste OPML content to extract feed URLs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="opml-file" className="text-base font-semibold">Upload OPML File</Label>
                <Input
                  id="opml-file"
                  type="file"
                  accept=".opml,.xml"
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opml-content" className="text-base font-semibold">Or Paste OPML Content</Label>
                <textarea
                  id="opml-content"
                  value={opmlContent}
                  onChange={(e) => setOpmlContent(e.target.value)}
                  disabled={loading}
                  placeholder="Paste OPML XML content here..."
                  className="w-full min-h-[200px] p-3 border rounded-md text-sm font-mono"
                />
              </div>
              <Button
                onClick={handleParse}
                disabled={loading || !opmlContent.trim()}
                className="w-full sm:w-auto"
              >
                {loading ? 'Parsing...' : 'Parse OPML'}
              </Button>
            </CardContent>
          </Card>

          {loading && <LoadingState message="Parsing OPML..." />}

          {parsedOPML && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Parsed OPML</CardTitle>
                <CardDescription className="text-sm">
                  {parsedOPML.feeds.length} feed(s) found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Title</p>
                    <p className="text-sm font-medium">{parsedOPML.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Date Created</p>
                      <p className="text-sm font-medium">
                        {new Date(parsedOPML.dateCreated).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Date Modified</p>
                      <p className="text-sm font-medium">
                        {new Date(parsedOPML.dateModified).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">Feeds</p>
                    <div className="space-y-2 max-h-96 overflow-auto">
                      {parsedOPML.feeds.map((feed, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold break-words">{feed.title}</p>
                              <p className="text-xs font-mono text-muted-foreground break-all mt-1">
                                {feed.xmlUrl}
                              </p>
                              {feed.htmlUrl && feed.htmlUrl !== feed.xmlUrl && (
                                <p className="text-xs text-muted-foreground break-all mt-1">
                                  HTML: {feed.htmlUrl}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs sm:text-sm flex-shrink-0">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Valid
                            </Badge>
                          </div>
                          {feed.description && (
                            <p className="text-xs text-muted-foreground mt-2">{feed.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {error && <ErrorDisplay error={error} />}
    </div>
  );
}

