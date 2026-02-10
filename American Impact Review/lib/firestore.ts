import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
  endAt,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Article, Submission, SubmissionStatus, UserProfile } from "@/lib/types";

type UserProfileInput = {
  uid: string;
  username: string;
  name: string;
  field: string;
  bio: string;
  photoUrl?: string;
};

export async function createUserProfile(input: UserProfileInput) {
  const ref = doc(db, "users", input.uid);
  await setDoc(ref, {
    ...input,
    usernameLower: input.username.toLowerCase(),
    createdAt: serverTimestamp()
  });
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfileInput>) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, updates);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    uid,
    username: data.username,
    name: data.name,
    field: data.field,
    bio: data.bio,
    photoUrl: data.photoUrl ?? "",
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null
  };
}

export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  const usersRef = collection(db, "users");
  const userQuery = query(usersRef, where("username", "==", username), limit(1));
  const snapshot = await getDocs(userQuery);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  const data = docSnap.data();
  return {
    uid: docSnap.id,
    username: data.username,
    name: data.name,
    field: data.field,
    bio: data.bio,
    photoUrl: data.photoUrl ?? "",
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null
  };
}

export async function getAdminStatus(uid: string): Promise<boolean> {
  const ref = doc(db, "admins", uid);
  const snapshot = await getDoc(ref);
  return snapshot.exists();
}

type ArticleInput = {
  title: string;
  abstract?: string;
  content: string;
  slug: string;
  authorId: string;
  authorUsername: string;
  category: string;
  articleType?: string;
  authors?: string[];
  correspondingAuthorName?: string;
  correspondingAuthorEmail?: string;
  orcids?: string[];
  imageUrl: string;
  imageUrls: string[];
  keywords?: string[];
  doi?: string;
  receivedAt?: Date | null;
  acceptedAt?: Date | null;
  publishedAt?: Date | null;
  affiliations?: string[];
  funding?: string;
  competingInterests?: string;
  dataAvailability?: string;
  ethicsStatement?: string;
  authorContributions?: string;
  acknowledgments?: string;
  license?: string;
  openAccess?: boolean;
  figures?: {
    title: string;
    caption: string;
    chartType: "bar" | "line";
    data: { labels: string[]; values: number[] };
    sourceTitle: string;
    sourceUrl: string;
    license?: string;
  }[];
};

type SubmissionInput = {
  title: string;
  abstract?: string;
  content: string;
  authorId: string;
  authorUsername: string;
  category: string;
  articleType?: string;
  authors?: string[];
  correspondingAuthorName?: string;
  correspondingAuthorEmail?: string;
  orcids?: string[];
  imageUrl: string;
  imageUrls: string[];
  keywords?: string[];
  doi?: string;
  receivedAt?: Date | null;
  acceptedAt?: Date | null;
  publishedAt?: Date | null;
  affiliations?: string[];
  funding?: string;
  competingInterests?: string;
  dataAvailability?: string;
  ethicsStatement?: string;
  authorContributions?: string;
  acknowledgments?: string;
  license?: string;
  openAccess?: boolean;
  figures?: {
    title: string;
    caption: string;
    chartType: "bar" | "line";
    data: { labels: string[]; values: number[] };
    sourceTitle: string;
    sourceUrl: string;
    license?: string;
  }[];
};

type ReviewerInquiryInput = {
  name: string;
  email: string;
  field: string;
  availability: string;
  about: string;
};

export async function createArticle(input: ArticleInput) {
  const ref = collection(db, "articles");
  const docRef = await addDoc(ref, {
    ...input,
    imageUrls: input.imageUrls ?? [],
    keywords: input.keywords ?? [],
    abstract: input.abstract ?? "",
    articleType: input.articleType ?? "",
    authors: input.authors ?? [],
    correspondingAuthorName: input.correspondingAuthorName ?? "",
    correspondingAuthorEmail: input.correspondingAuthorEmail ?? "",
    orcids: input.orcids ?? [],
    doi: input.doi ?? "",
    receivedAt: input.receivedAt ?? null,
    acceptedAt: input.acceptedAt ?? null,
    publishedAt: input.publishedAt ?? null,
    affiliations: input.affiliations ?? [],
    funding: input.funding ?? "",
    competingInterests: input.competingInterests ?? "",
    dataAvailability: input.dataAvailability ?? "",
    ethicsStatement: input.ethicsStatement ?? "",
    authorContributions: input.authorContributions ?? "",
    acknowledgments: input.acknowledgments ?? "",
    license: input.license ?? "",
    openAccess: input.openAccess ?? true,
    figures: input.figures ?? [],
    titleLower: input.title.toLowerCase(),
    authorUsernameLower: input.authorUsername.toLowerCase(),
    categoryLower: input.category.toLowerCase(),
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function createSubmission(input: SubmissionInput) {
  const ref = collection(db, "submissions");
  const docRef = await addDoc(ref, {
    ...input,
    imageUrls: input.imageUrls ?? [],
    keywords: input.keywords ?? [],
    abstract: input.abstract ?? "",
    articleType: input.articleType ?? "",
    authors: input.authors ?? [],
    correspondingAuthorName: input.correspondingAuthorName ?? "",
    correspondingAuthorEmail: input.correspondingAuthorEmail ?? "",
    orcids: input.orcids ?? [],
    doi: input.doi ?? "",
    receivedAt: input.receivedAt ?? null,
    acceptedAt: input.acceptedAt ?? null,
    publishedAt: input.publishedAt ?? null,
    affiliations: input.affiliations ?? [],
    funding: input.funding ?? "",
    competingInterests: input.competingInterests ?? "",
    dataAvailability: input.dataAvailability ?? "",
    ethicsStatement: input.ethicsStatement ?? "",
    authorContributions: input.authorContributions ?? "",
    acknowledgments: input.acknowledgments ?? "",
    license: input.license ?? "",
    openAccess: input.openAccess ?? true,
    figures: input.figures ?? [],
    titleLower: input.title.toLowerCase(),
    authorUsernameLower: input.authorUsername.toLowerCase(),
    categoryLower: input.category.toLowerCase(),
    status: "submitted",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function createReviewerInquiry(input: ReviewerInquiryInput) {
  const ref = collection(db, "reviewer_inquiries");
  const docRef = await addDoc(ref, {
    ...input,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function listSubmissionsByAuthor(uid: string): Promise<Submission[]> {
  const submissionsRef = collection(db, "submissions");
  const submissionsQuery = query(
    submissionsRef,
    where("authorId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snapshot = await getDocs(submissionsQuery);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title,
        content: data.content,
        authorId: data.authorId,
        authorUsername: data.authorUsername,
        category: data.category ?? "",
        imageUrl: data.imageUrl ?? "",
        imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        abstract: data.abstract ?? "",
        articleType: data.articleType ?? "",
        authors: Array.isArray(data.authors) ? data.authors : [],
        correspondingAuthorName: data.correspondingAuthorName ?? "",
        correspondingAuthorEmail: data.correspondingAuthorEmail ?? "",
        orcids: Array.isArray(data.orcids) ? data.orcids : [],
        doi: data.doi ?? "",
        receivedAt: data.receivedAt instanceof Timestamp ? data.receivedAt.toDate() : null,
        acceptedAt: data.acceptedAt instanceof Timestamp ? data.acceptedAt.toDate() : null,
        publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate() : null,
        affiliations: Array.isArray(data.affiliations) ? data.affiliations : [],
        funding: data.funding ?? "",
        competingInterests: data.competingInterests ?? "",
        dataAvailability: data.dataAvailability ?? "",
        ethicsStatement: data.ethicsStatement ?? "",
        authorContributions: data.authorContributions ?? "",
        acknowledgments: data.acknowledgments ?? "",
        license: data.license ?? "",
        openAccess: typeof data.openAccess === "boolean" ? data.openAccess : true,
        figures: Array.isArray(data.figures) ? data.figures : [],
        status: data.status as SubmissionStatus,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
        publishedArticleId: data.publishedArticleId
      };
    });
}

export async function listAllSubmissions(): Promise<Submission[]> {
  const submissionsRef = collection(db, "submissions");
  const submissionsQuery = query(submissionsRef, orderBy("createdAt", "desc"), limit(50));
  const snapshot = await getDocs(submissionsQuery);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title,
        content: data.content,
        authorId: data.authorId,
        authorUsername: data.authorUsername,
        category: data.category ?? "",
        imageUrl: data.imageUrl ?? "",
        imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        abstract: data.abstract ?? "",
        articleType: data.articleType ?? "",
        authors: Array.isArray(data.authors) ? data.authors : [],
        correspondingAuthorName: data.correspondingAuthorName ?? "",
        correspondingAuthorEmail: data.correspondingAuthorEmail ?? "",
        orcids: Array.isArray(data.orcids) ? data.orcids : [],
        doi: data.doi ?? "",
        receivedAt: data.receivedAt instanceof Timestamp ? data.receivedAt.toDate() : null,
        acceptedAt: data.acceptedAt instanceof Timestamp ? data.acceptedAt.toDate() : null,
        publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate() : null,
        affiliations: Array.isArray(data.affiliations) ? data.affiliations : [],
        funding: data.funding ?? "",
        competingInterests: data.competingInterests ?? "",
        dataAvailability: data.dataAvailability ?? "",
        ethicsStatement: data.ethicsStatement ?? "",
        authorContributions: data.authorContributions ?? "",
        acknowledgments: data.acknowledgments ?? "",
        license: data.license ?? "",
        openAccess: typeof data.openAccess === "boolean" ? data.openAccess : true,
        figures: Array.isArray(data.figures) ? data.figures : [],
        status: data.status as SubmissionStatus,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
        publishedArticleId: data.publishedArticleId
      };
    });
}

export async function updateSubmissionStatus(id: string, status: SubmissionStatus) {
  const ref = doc(db, "submissions", id);
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
}

export async function updateSubmissionMetadata(
  id: string,
  updates: Partial<Pick<SubmissionInput, "doi" | "receivedAt" | "acceptedAt" | "publishedAt" | "affiliations" | "funding" | "competingInterests" | "abstract" | "articleType" | "authors" | "correspondingAuthorName" | "correspondingAuthorEmail" | "orcids" | "dataAvailability" | "ethicsStatement" | "authorContributions" | "acknowledgments" | "license" | "openAccess">>
) {
  const ref = doc(db, "submissions", id);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function publishSubmission(submission: Submission, slug: string) {
  const articleId = await createArticle({
    title: submission.title,
    abstract: submission.abstract ?? "",
    content: submission.content,
    slug,
    authorId: submission.authorId,
    authorUsername: submission.authorUsername,
    category: submission.category,
    articleType: submission.articleType ?? "",
    authors: submission.authors ?? [],
    correspondingAuthorName: submission.correspondingAuthorName ?? "",
    correspondingAuthorEmail: submission.correspondingAuthorEmail ?? "",
    orcids: submission.orcids ?? [],
    imageUrl: submission.imageUrl,
    imageUrls: submission.imageUrls,
    keywords: submission.keywords ?? [],
    doi: submission.doi ?? "",
    receivedAt: submission.receivedAt ?? null,
    acceptedAt: submission.acceptedAt ?? null,
    publishedAt: submission.publishedAt ?? null,
    affiliations: submission.affiliations ?? [],
    funding: submission.funding ?? "",
    competingInterests: submission.competingInterests ?? "",
    dataAvailability: submission.dataAvailability ?? "",
    ethicsStatement: submission.ethicsStatement ?? "",
    authorContributions: submission.authorContributions ?? "",
    acknowledgments: submission.acknowledgments ?? "",
    license: submission.license ?? "",
    openAccess: typeof submission.openAccess === "boolean" ? submission.openAccess : true,
    figures: submission.figures ?? []
  });
  const ref = doc(db, "submissions", submission.id);
  await updateDoc(ref, {
    status: "published",
    publishedArticleId: articleId,
    updatedAt: serverTimestamp()
  });
  return articleId;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articlesRef = collection(db, "articles");
  const articleQuery = query(articlesRef, where("slug", "==", slug), limit(1));
  const snapshot = await getDocs(articleQuery);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title,
    abstract: data.abstract ?? "",
    content: data.content,
    slug: data.slug,
    authorId: data.authorId,
    authorUsername: data.authorUsername,
    category: data.category ?? "",
    articleType: data.articleType ?? "",
    authors: Array.isArray(data.authors) ? data.authors : [],
    correspondingAuthorName: data.correspondingAuthorName ?? "",
    correspondingAuthorEmail: data.correspondingAuthorEmail ?? "",
    orcids: Array.isArray(data.orcids) ? data.orcids : [],
    imageUrl: data.imageUrl ?? "",
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    doi: data.doi ?? "",
    receivedAt: data.receivedAt instanceof Timestamp ? data.receivedAt.toDate() : null,
    acceptedAt: data.acceptedAt instanceof Timestamp ? data.acceptedAt.toDate() : null,
    publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate() : null,
    affiliations: Array.isArray(data.affiliations) ? data.affiliations : [],
    funding: data.funding ?? "",
    competingInterests: data.competingInterests ?? "",
    dataAvailability: data.dataAvailability ?? "",
    ethicsStatement: data.ethicsStatement ?? "",
    authorContributions: data.authorContributions ?? "",
    acknowledgments: data.acknowledgments ?? "",
    license: data.license ?? "",
    openAccess: typeof data.openAccess === "boolean" ? data.openAccess : true,
    figures: Array.isArray(data.figures) ? data.figures : [],
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null
  };
}

export async function listRecentArticles(): Promise<Article[]> {
  const articlesRef = collection(db, "articles");
  const articlesQuery = query(articlesRef, orderBy("createdAt", "desc"), limit(20));
  const snapshot = await getDocs(articlesQuery);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title,
      abstract: data.abstract ?? "",
      content: data.content,
      slug: data.slug,
      authorId: data.authorId,
      authorUsername: data.authorUsername,
      category: data.category ?? "",
      articleType: data.articleType ?? "",
      authors: Array.isArray(data.authors) ? data.authors : [],
      correspondingAuthorName: data.correspondingAuthorName ?? "",
      correspondingAuthorEmail: data.correspondingAuthorEmail ?? "",
      orcids: Array.isArray(data.orcids) ? data.orcids : [],
      imageUrl: data.imageUrl ?? "",
      imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
      keywords: Array.isArray(data.keywords) ? data.keywords : [],

      abstract: data.abstract ?? "",
      articleType: data.articleType ?? "",
      authors: Array.isArray(data.authors) ? data.authors : [],
      correspondingAuthorName: data.correspondingAuthorName ?? "",
      correspondingAuthorEmail: data.correspondingAuthorEmail ?? "",
      orcids: Array.isArray(data.orcids) ? data.orcids : [],
      doi: data.doi ?? "",
      receivedAt: data.receivedAt instanceof Timestamp ? data.receivedAt.toDate() : null,
      acceptedAt: data.acceptedAt instanceof Timestamp ? data.acceptedAt.toDate() : null,
      publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate() : null,
      affiliations: Array.isArray(data.affiliations) ? data.affiliations : [],
      funding: data.funding ?? "",
      competingInterests: data.competingInterests ?? "",
      dataAvailability: data.dataAvailability ?? "",
      ethicsStatement: data.ethicsStatement ?? "",
      authorContributions: data.authorContributions ?? "",
      acknowledgments: data.acknowledgments ?? "",
      license: data.license ?? "",
      openAccess: typeof data.openAccess === "boolean" ? data.openAccess : true,
      figures: Array.isArray(data.figures) ? data.figures : [],
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null
    };
  });
}

export async function searchArticles(params: {
  queryText?: string;
  category?: string;
  authorUsername?: string;
}): Promise<Article[]> {
  const articlesRef = collection(db, "articles");
  const qText = params.queryText?.trim().toLowerCase() ?? "";
  const category = params.category?.trim().toLowerCase() ?? "";
  const authorUsername = params.authorUsername?.trim().toLowerCase() ?? "";

  if (authorUsername) {
    const authorQuery = query(
      articlesRef,
      where("authorUsernameLower", "==", authorUsername),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const snapshot = await getDocs(authorQuery);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title,
      content: data.content,
      slug: data.slug,
      authorId: data.authorId,
      authorUsername: data.authorUsername,
      category: data.category ?? "",
      imageUrl: data.imageUrl ?? "",
      imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
      keywords: Array.isArray(data.keywords) ? data.keywords : [],

      abstract: data.abstract ?? "",
      articleType: data.articleType ?? "",
      authors: Array.isArray(data.authors) ? data.authors : [],
      correspondingAuthorName: data.correspondingAuthorName ?? "",
      correspondingAuthorEmail: data.correspondingAuthorEmail ?? "",
      orcids: Array.isArray(data.orcids) ? data.orcids : [],
      doi: data.doi ?? "",
      receivedAt: data.receivedAt instanceof Timestamp ? data.receivedAt.toDate() : null,
      acceptedAt: data.acceptedAt instanceof Timestamp ? data.acceptedAt.toDate() : null,
      publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate() : null,
      affiliations: Array.isArray(data.affiliations) ? data.affiliations : [],
      funding: data.funding ?? "",
      competingInterests: data.competingInterests ?? "",

      dataAvailability: data.dataAvailability ?? "",
      ethicsStatement: data.ethicsStatement ?? "",
      authorContributions: data.authorContributions ?? "",
      acknowledgments: data.acknowledgments ?? "",
      license: data.license ?? "",
      openAccess: typeof data.openAccess === "boolean" ? data.openAccess : true,
      figures: Array.isArray(data.figures) ? data.figures : [],
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null
    };
  });
  }

  if (qText) {
    const tokens = qText
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .slice(0, 10);

    let results: Article[] = [];
    if (tokens.length) {
      const keywordQuery = query(
        articlesRef,
        where("keywords", "array-contains-any", tokens),
        limit(20)
      );
      const snapshot = await getDocs(keywordQuery);
      results = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title,
          content: data.content,
          slug: data.slug,
          authorId: data.authorId,
          authorUsername: data.authorUsername,
          category: data.category ?? "",
          imageUrl: data.imageUrl ?? "",
          imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
          keywords: Array.isArray(data.keywords) ? data.keywords : [],

        abstract: data.abstract ?? "",
        articleType: data.articleType ?? "",
        authors: Array.isArray(data.authors) ? data.authors : [],
        correspondingAuthorName: data.correspondingAuthorName ?? "",
        correspondingAuthorEmail: data.correspondingAuthorEmail ?? "",
        orcids: Array.isArray(data.orcids) ? data.orcids : [],
          doi: data.doi ?? "",
          receivedAt: data.receivedAt instanceof Timestamp ? data.receivedAt.toDate() : null,
          acceptedAt: data.acceptedAt instanceof Timestamp ? data.acceptedAt.toDate() : null,
          publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate() : null,
          affiliations: Array.isArray(data.affiliations) ? data.affiliations : [],
          funding: data.funding ?? "",
          competingInterests: data.competingInterests ?? "",

        dataAvailability: data.dataAvailability ?? "",
        ethicsStatement: data.ethicsStatement ?? "",
        authorContributions: data.authorContributions ?? "",
        acknowledgments: data.acknowledgments ?? "",
        license: data.license ?? "",
        openAccess: typeof data.openAccess === "boolean" ? data.openAccess : true,
        figures: Array.isArray(data.figures) ? data.figures : [],
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null
        };
      });
    }

    if (results.length === 0) {
      const prefixQuery = query(
        articlesRef,
        orderBy("titleLower"),
        startAt(qText),
        endAt(`${qText}\uf8ff`),
        limit(20)
      );
      const snapshot = await getDocs(prefixQuery);
      results = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title,
          content: data.content,
          slug: data.slug,
          authorId: data.authorId,
          authorUsername: data.authorUsername,
          category: data.category ?? "",
          imageUrl: data.imageUrl ?? "",
          imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
          keywords: Array.isArray(data.keywords) ? data.keywords : [],

        abstract: data.abstract ?? "",
        articleType: data.articleType ?? "",
        authors: Array.isArray(data.authors) ? data.authors : [],
        correspondingAuthorName: data.correspondingAuthorName ?? "",
        correspondingAuthorEmail: data.correspondingAuthorEmail ?? "",
        orcids: Array.isArray(data.orcids) ? data.orcids : [],
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null
        };
      });
    }

    if (results.length === 0) {
      const recent = await listRecentArticles();
      results = recent.filter((article) =>
        article.content.toLowerCase().includes(qText.toLowerCase())
      );
    }

    if (category) {
      results = results.filter((article) => article.category.toLowerCase() === category);
    }
    return results;
  }

  if (category) {
    const categoryQuery = query(
      articlesRef,
      where("categoryLower", "==", category),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const snapshot = await getDocs(categoryQuery);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title,
        content: data.content,
        slug: data.slug,
        authorId: data.authorId,
      authorUsername: data.authorUsername,
      category: data.category ?? "",
      imageUrl: data.imageUrl ?? "",
      imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
      keywords: Array.isArray(data.keywords) ? data.keywords : [],

      abstract: data.abstract ?? "",
      articleType: data.articleType ?? "",
      authors: Array.isArray(data.authors) ? data.authors : [],
      correspondingAuthorName: data.correspondingAuthorName ?? "",
      correspondingAuthorEmail: data.correspondingAuthorEmail ?? "",
      orcids: Array.isArray(data.orcids) ? data.orcids : [],
      doi: data.doi ?? "",
      receivedAt: data.receivedAt instanceof Timestamp ? data.receivedAt.toDate() : null,
      acceptedAt: data.acceptedAt instanceof Timestamp ? data.acceptedAt.toDate() : null,
      publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate() : null,
      affiliations: Array.isArray(data.affiliations) ? data.affiliations : [],
      funding: data.funding ?? "",
      competingInterests: data.competingInterests ?? "",

      dataAvailability: data.dataAvailability ?? "",
      ethicsStatement: data.ethicsStatement ?? "",
      authorContributions: data.authorContributions ?? "",
      acknowledgments: data.acknowledgments ?? "",
      license: data.license ?? "",
      openAccess: typeof data.openAccess === "boolean" ? data.openAccess : true,
      figures: Array.isArray(data.figures) ? data.figures : [],
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null
    };
  });
  }

  return listRecentArticles();
}

export async function listArticlesByAuthorUsername(
  authorUsername: string
): Promise<Article[]> {
  const articlesRef = collection(db, "articles");
  const articlesQuery = query(
    articlesRef,
    where("authorUsernameLower", "==", authorUsername.toLowerCase()),
    limit(50)
  );
  const snapshot = await getDocs(articlesQuery);
  const results = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title,
      content: data.content,
      slug: data.slug,
      authorId: data.authorId,
      authorUsername: data.authorUsername,
      category: data.category ?? "",
      imageUrl: data.imageUrl ?? "",
      imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
      keywords: Array.isArray(data.keywords) ? data.keywords : [],

      abstract: data.abstract ?? "",
      articleType: data.articleType ?? "",
      authors: Array.isArray(data.authors) ? data.authors : [],
      correspondingAuthorName: data.correspondingAuthorName ?? "",
      correspondingAuthorEmail: data.correspondingAuthorEmail ?? "",
      orcids: Array.isArray(data.orcids) ? data.orcids : [],
      doi: data.doi ?? "",
      receivedAt: data.receivedAt instanceof Timestamp ? data.receivedAt.toDate() : null,
      acceptedAt: data.acceptedAt instanceof Timestamp ? data.acceptedAt.toDate() : null,
      publishedAt: data.publishedAt instanceof Timestamp ? data.publishedAt.toDate() : null,
      affiliations: Array.isArray(data.affiliations) ? data.affiliations : [],
      funding: data.funding ?? "",
      competingInterests: data.competingInterests ?? "",

      dataAvailability: data.dataAvailability ?? "",
      ethicsStatement: data.ethicsStatement ?? "",
      authorContributions: data.authorContributions ?? "",
      acknowledgments: data.acknowledgments ?? "",
      license: data.license ?? "",
      openAccess: typeof data.openAccess === "boolean" ? data.openAccess : true,
      figures: Array.isArray(data.figures) ? data.figures : [],
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null
    };
  });
  return results.sort((a, b) => {
    const aTime = a.createdAt ? a.createdAt.getTime() : 0;
    const bTime = b.createdAt ? b.createdAt.getTime() : 0;
    return bTime - aTime;
  });
}
