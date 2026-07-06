class Scheme {
  final String id;
  final String title;
  final String description;
  final String provider;
  final String status;
  final String coverImage;
  final String deadline;

  Scheme({
    required this.id,
    required this.title,
    required this.description,
    required this.provider,
    required this.status,
    required this.coverImage,
    required this.deadline,
  });

  factory Scheme.fromJson(Map<String, dynamic> json) {
    return Scheme(
      id: json['id'] ?? json['_id']?.toString() ?? '',
      title: json['title'] ?? json['name'] ?? '',
      description: json['description'] ?? '',
      provider: json['provider'] ?? json['department'] ?? '',
      status: json['status'] ?? '',
      coverImage: json['coverImage'] ?? '',
      deadline: json['deadline'] ?? '',
    );
  }
}
