import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { blogCollection, slugRedirectsCollection, blogCommentsCollection } from '@/lib/firebase/collections';
import { SchemaGenerator } from '@/lib/seo/schema-generator';
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

    // Get comment count
    const comments = await blogCommentsCollection.query(
      [{ field: 'postId', operator: '==', value: post.id }]
    );
    const commentCount = comments.length;

    const jsonLd = SchemaGenerator.generateBlogPosting(post, commentCount);

    return (
      <>
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
        <BlogPostDetail post={post} />
      </>
    );
  } catch (error) {
    console.error('Error loading blog post:', error);
    notFound();
  }
}
