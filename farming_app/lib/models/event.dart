class Event {
  final String id;
  final String name;
  final String description;
  final String date;
  final String location;
  final String coverImage;
  final String status;

  Event({
    required this.id,
    required this.name,
    required this.description,
    required this.date,
    required this.location,
    required this.coverImage,
    required this.status,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'] ?? json['_id']?.toString() ?? '',
      name: json['name'] ?? json['title'] ?? '',
      description: json['description'] ?? '',
      date: json['date'] ?? json['startDate'] ?? '',
      location: json['location'] ?? '',
      coverImage: json['coverImage'] ?? '',
      status: json['status'] ?? '',
    );
  }
}
