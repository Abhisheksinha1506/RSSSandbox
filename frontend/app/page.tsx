import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Eye, Zap, Shield, Search, Radio, RefreshCw, Link as LinkIcon, BarChart3, GitCompare, FileDown } from 'lucide-react';

const tools = [
  {
    name: 'RSS Spec & Linter Docs',
    href: '/spec',
    icon: FileText,
    description: 'Interactive specification documentation with live linting for RSS, Atom, and JSON Feed formats.',
    color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
  },
  {
    name: 'Feed Preview Sandbox',
    href: '/preview',
    icon: Eye,
    description: 'Preview how your feed looks across multiple reader templates and styles.',
    color: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
  },
  {
    name: 'HTTP Caching Tester',
    href: '/cache-test',
    icon: Zap,
    description: 'Test ETag, Last-Modified headers and conditional GET behavior to ensure proper caching.',
    color: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
  },
  {
    name: 'Alt/Text Enforcer',
    href: '/accessibility',
    icon: Shield,
    description: 'Check and fix missing alt-text in images and enclosures for better accessibility.',
    color: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
  },
  {
    name: 'Robots/Headers Lab',
    href: '/robots-lab',
    icon: Search,
    description: 'Test robots.txt rules, CORS headers, and simulate how different clients access your feed.',
    color: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800',
  },
  {
    name: 'WebSub Hub Tester',
    href: '/websub-test',
    icon: Radio,
    description: 'Verify and debug WebSub (PubSubHubbub) publisher/subscriber flows.',
    color: 'bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800',
  },
  {
    name: 'Feed Format Converter',
    href: '/convert',
    icon: RefreshCw,
    description: 'Convert feeds between RSS 2.0, Atom, and JSON Feed formats.',
    color: 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800',
  },
  {
    name: 'Feed Link Checker',
    href: '/link-check',
    icon: LinkIcon,
    description: 'Validate all links in your feed to find broken URLs and redirects.',
    color: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
  },
  {
    name: 'Feed Statistics Dashboard',
    href: '/statistics',
    icon: BarChart3,
    description: 'Comprehensive statistics and metrics for your RSS feed.',
    color: 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800',
  },
  {
    name: 'Feed Comparison Tool',
    href: '/compare',
    icon: GitCompare,
    description: 'Compare two feeds side-by-side to find differences and similarities.',
    color: 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800',
  },
  {
    name: 'OPML Generator',
    href: '/opml',
    icon: FileDown,
    description: 'Generate OPML files from feed URLs or parse existing OPML files.',
    color: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
  },
];

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center space-y-4 sm:space-y-6 md:space-y-8 text-center mb-8 sm:mb-12 md:mb-16">
          <div className="relative w-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent px-4">
              RSS Developer Suite
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/15 to-primary/10 rounded-lg blur-sm opacity-50 -z-10"></div>
          </div>
          <p className="max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed px-4">
            Comprehensive toolkit for RSS developers and publishers. Test, validate, and optimize your feeds with our collection of professional developer tools.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8 sm:mb-12 md:mb-16">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card 
                key={tool.href} 
                className={`flex flex-col transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary/50 active:scale-[0.98] ${tool.color} group`}
              >
                <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex items-start sm:items-center gap-3 mb-3">
                    <div className="p-2 sm:p-2.5 rounded-lg bg-background/50 backdrop-blur-sm border group-hover:bg-background/80 transition-colors flex-shrink-0">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl font-bold leading-tight">{tool.name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm leading-relaxed mt-2">{tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
                  <Button asChild className="w-full font-semibold text-sm sm:text-base h-10 sm:h-11">
                    <Link href={tool.href}>Open Tool</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="rounded-xl border-2 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm p-6 sm:p-8 md:p-12 text-center shadow-lg">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Why RSS Developer Suite?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The only all-in-one RSS development toolkit that helps publishers create standards-compliant, performant, and accessible feeds. 
            <span className="font-semibold text-foreground"> No database required</span> - completely stateless and privacy-focused.
          </p>
        </div>
      </div>
    </div>
  );
}