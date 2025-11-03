'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LinterPanel } from '@/components/spec/LinterPanel';

export default function SpecPage() {
  return (
    <div className="container py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8 md:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          RSS Spec & Linter Docs
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
          Interactive specification documentation with live linting for RSS, Atom, and JSON Feed formats.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-4 sm:space-y-6">
          <LinterPanel />
        </div>
        
        <div className="space-y-4 sm:space-y-6">

          <Tabs defaultValue="rss" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto gap-1 sm:gap-2">
              <TabsTrigger value="rss" className="text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto">RSS 2.0</TabsTrigger>
              <TabsTrigger value="atom" className="text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto">Atom</TabsTrigger>
              <TabsTrigger value="json" className="text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto">JSON Feed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rss" className="mt-4 sm:mt-6">
              <Card>
                <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl">RSS 2.0 Specification</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm sm:prose max-w-none text-xs sm:text-sm md:text-base px-4 sm:px-6 pb-4 sm:pb-6">
                <h3>Overview</h3>
                <p>
                  RSS 2.0 is a format for syndicating news and the content of news-like sites.
                  The format is specified by <a href="https://www.rssboard.org/rss-specification" target="_blank" rel="noopener noreferrer">RSS 2.0 Specification</a>.
                </p>
                
                <h3>Required Elements</h3>
                <ul>
                  <li><code>&lt;title&gt;</code> - The name of the channel</li>
                  <li><code>&lt;link&gt;</code> - The URL to the HTML website</li>
                  <li><code>&lt;description&gt;</code> - Phrase or sentence describing the channel</li>
                  <li><code>&lt;item&gt;</code> - Contains item elements</li>
                </ul>

                <h3>Item Elements</h3>
                <ul>
                  <li><code>&lt;title&gt;</code> - Title of the item</li>
                  <li><code>&lt;link&gt;</code> - URL of the item</li>
                  <li><code>&lt;description&gt;</code> - Item synopsis</li>
                  <li><code>&lt;pubDate&gt;</code> - Publication date (RFC 822 format)</li>
                  <li><code>&lt;guid&gt;</code> - Unique identifier</li>
                  <li><code>&lt;author&gt;</code> - Email address of the author</li>
                </ul>

                <h3>Best Practices</h3>
                <ul>
                  <li>Always include a valid &lt;link&gt; element</li>
                  <li>Use &lt;guid&gt; for item uniqueness</li>
                  <li>Include &lt;pubDate&gt; in RFC 822 format</li>
                  <li>Keep descriptions concise (recommended: under 500 characters)</li>
                  <li>Validate your feed before publishing</li>
                </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="atom" className="mt-4 sm:mt-6">
              <Card>
                <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl">Atom Specification</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm sm:prose max-w-none text-xs sm:text-sm md:text-base px-4 sm:px-6 pb-4 sm:pb-6">
                <h3>Overview</h3>
                <p>
                  Atom is an XML-based document format that describes lists of related information known as &quot;feeds&quot;.
                  The format is specified by <a href="https://tools.ietf.org/html/rfc4287" target="_blank" rel="noopener noreferrer">RFC 4287</a>.
                </p>

                <h3>Required Elements</h3>
                <ul>
                  <li><code>&lt;title&gt;</code> - A human-readable title</li>
                  <li><code>&lt;id&gt;</code> - A unique IRI identifying the feed</li>
                  <li><code>&lt;updated&gt;</code> - Most recent modification date (RFC 3339 format)</li>
                </ul>

                <h3>Entry Elements</h3>
                <ul>
                  <li><code>&lt;title&gt;</code> - Human-readable title</li>
                  <li><code>&lt;id&gt;</code> - Unique identifier (IRI)</li>
                  <li><code>&lt;updated&gt;</code> - Last modification date</li>
                  <li><code>&lt;link&gt;</code> - Related resource link</li>
                  <li><code>&lt;summary&gt;</code> - Brief summary of the entry</li>
                  <li><code>&lt;content&gt;</code> - Full content of the entry</li>
                  <li><code>&lt;author&gt;</code> - Author information</li>
                </ul>

                <h3>Best Practices</h3>
                <ul>
                  <li>Use IRI identifiers (not just URLs)</li>
                  <li>Include &lt;updated&gt; timestamps in RFC 3339 format</li>
                  <li>Provide both &lt;summary&gt; and &lt;content&gt; when appropriate</li>
                  <li>Include author information for each entry</li>
                  <li>Use proper XML namespaces</li>
                </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="json" className="mt-4 sm:mt-6">
              <Card>
                <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl">JSON Feed Specification</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm sm:prose max-w-none text-xs sm:text-sm md:text-base px-4 sm:px-6 pb-4 sm:pb-6">
                <h3>Overview</h3>
                <p>
                  JSON Feed is a format similar to RSS and Atom but using JSON instead of XML.
                  The format is specified at <a href="https://jsonfeed.org/" target="_blank" rel="noopener noreferrer">jsonfeed.org</a>.
                </p>

                <h3>Required Fields</h3>
                <ul>
                  <li><code>version</code> - Must be &quot;https://jsonfeed.org/version/1.1&quot;</li>
                  <li><code>title</code> - Name of the feed</li>
                  <li><code>items</code> - Array of feed items</li>
                </ul>

                <h3>Item Fields</h3>
                <ul>
                  <li><code>id</code> - Unique identifier for the item</li>
                  <li><code>url</code> - URL of the item (optional but recommended)</li>
                  <li><code>title</code> - Title of the item</li>
                  <li><code>content_html</code> or <code>content_text</code> - Content</li>
                  <li><code>date_published</code> - Publication date (RFC 3339)</li>
                  <li><code>date_modified</code> - Modification date (RFC 3339)</li>
                  <li><code>authors</code> - Array of author objects</li>
                  <li><code>tags</code> - Array of tag strings</li>
                </ul>

                <h3>Best Practices</h3>
                <ul>
                  <li>Always include <code>id</code> for each item</li>
                  <li>Use RFC 3339 format for dates</li>
                  <li>Provide both HTML and text content when possible</li>
                  <li>Include author information</li>
                  <li>Use <code>attachments</code> for media files</li>
                </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
