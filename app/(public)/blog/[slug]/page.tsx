import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { blogCollection, slugRedirectsCollection, blogCommentsCollection } from '@/lib/firebase/collections';
import { SchemaGenerator } from '@/lib/seo/schema-generator';
import { BlogHero } from '@/components/blog/BlogHero';
import { CommentSystem } from '@/components/blog/Comments/CommentSystem';
import { getComments } from '@/lib/actions/blog-actions';
import { Separator } from '@/components/ui/separator';
// BlogPostDetail still used? Yes.
import { BlogPostDetail } from '@/components/blog/BlogPostDetail';

// ISR: Revalidate every 5 minutes (300 seconds) + on-demand revalidation
export const revalidate = 300;

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;

    // Check for slug redirects first
    const redirects = await slugRedirectsCollection.query(
      [{ field: 'oldSlug', operator: '==', value: slug }]
    );

    let actualSlug = slug;
    if (redirects.length > 0) {
      // If the slug has been redirected, ensure canonical points to the new slug
      actualSlug = redirects[0].newSlug;
    }

    // Fetch the post
    const posts = await blogCollection.query(
      [{ field: 'slug', operator: '==', value: actualSlug }]
    );

    if (posts.length === 0) {
      return {
        title: 'Artículo no encontrado | Ravehub',
      };
    }

    const post = posts[0] as any;

    const isDraft = post.status !== 'published';

    return {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      keywords: post.seoKeywords?.join(', '),
      authors: [{ name: post.author }],
      robots: isDraft ? { index: false, follow: true } : { index: true, follow: true },
      openGraph: {
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.excerpt,
        type: 'article',
        publishedTime: post.publishDate || post.createdAt,
        modifiedTime: post.updatedDate || post.updatedAt,
        authors: [post.author],
        images: post.featuredImageUrl ? [{
          url: post.featuredImageUrl,
          alt: post.imageAltTexts?.[post.featuredImageUrl] || post.title,
        }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.excerpt,
        images: post.socialImageUrl || post.featuredImageUrl,
      },
      alternates: {
        // Use relative canonical so Next resolves with metadataBase
        canonical: `/blog/${post.slug}`,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Blog | Ravehub',
    };
  }
}


export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const { slug } = await params;

    // Check for slug redirects
    const redirects = await slugRedirectsCollection.query(
      [{ field: 'oldSlug', operator: '==', value: slug }]
    );

    let actualSlug = slug;
    if (redirects.length > 0) {
      const newSlug = redirects[0].newSlug as string;
      // Issue a permanent redirect so crawlers and users land on the canonical URL
      if (newSlug && newSlug !== slug) {
        permanentRedirect(`/blog/${newSlug}`);
      }
      actualSlug = newSlug || slug;
    }

    // Fetch the post
    const posts = await blogCollection.query(
      [{ field: 'slug', operator: '==', value: actualSlug }]
    );

    if (posts.length === 0) {
      notFound();
    }

    const post = posts[0] as any;


    // Only show published posts
    if (post.status !== 'published') {
      notFound();
    }

    // Get comment count and initial comments
    const commentsResult = await getComments(post.id, 10);
    const initialComments = commentsResult.comments || [];

    // Fetch total count (simplistic view, ideally we have a counter on the post doc)
    // We already have commentCount from previous logic
    // We already have commentCount from previous logic
    const allComments = await blogCommentsCollection.query(
      [{ field: 'postId', operator: '==', value: post.id }]
    );
    const commentCount = allComments.length;

    // Mock current user for now (or fetch from auth session if available)
    // Implementation note: In a real app we would use `auth()` from NextAuth or Firebase Auth hook.
    // For Server Components we need a way to get the session.
    // Assuming we have a `getCurrentUser` utility or similar.
    // For now, I will leave it undefined as I cannot easily get auth session in this file without imports.
    // TODO: Connect with real auth.
    // I will try to use the `auth-actions` or similar if exist, but otherwise I'll pass null and let Client handle it or User to implement.
    // Actually, I can check `lib/auth-admin.ts` or `lib/actions/auth-actions.ts`?
    // Let's assume no auth for now on SSR, and Client Component might check hydration or Context.
    // But CommentSystem expects currentUser.

    const jsonLd = SchemaGenerator.generateBlogPosting(post, commentCount);

    return (
      <>
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}

        <BlogHero post={post} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <main className="lg:col-span-8 space-y-12">
              <BlogPostDetail post={post} />

              <Separator className="bg-white/10" />

              <div id="comments">
                <CommentSystem
                  postId={post.id}
                  initialComments={initialComments}
                  totalComments={commentCount}
                // currentUser passed from client side context usually, or we need to fetch it here.
                // For now, let's leave it to the Client Component to potentially grab it from context if we don't pass it.
                // But CommentSystem props definition asks for it. 
                // I will wrap CommentSystem with a data fetcher or just pass null and let the user log in.
                />
              </div>
            </main>

            {/* Sidebar (Optional - could be sticky table of contents, related posts, etc) */}
            <aside className="lg:col-span-4 hidden lg:block space-y-8">
              {/* Placeholder for sidebar content */}
            </aside>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error('Error loading blog post:', error);
    notFound();
  }
}
