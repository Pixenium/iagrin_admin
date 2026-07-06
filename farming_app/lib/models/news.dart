class News {
  final String id;
  final String title;
  final String content;
  final String summary;
  final String category;
  final String coverImage;
  final String source;
  final String publishedDate;
  final String status;

  News({
    required this.id,
    required this.title,
    required this.content,
    required this.summary,
    required this.category,
    required this.coverImage,
    required this.source,
    required this.publishedDate,
    required this.status,
  });

  factory News.fromJson(Map<String, dynamic> json) {
    return News(
      id: json['id'] ?? json['_id']?.toString() ?? '',
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      summary: json['summary'] ?? '',
      category: json['category'] ?? '',
      coverImage: json['coverImage'] ?? '',
      source: json['source'] ?? json['author'] ?? '',
      publishedDate: json['publishedDate'] ?? '',
      status: json['status'] ?? '',
    );
  }
}
