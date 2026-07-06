class Machinery {
  final String id;
  final String name;
  final String description;
  final String brand;
  final String coverImage;
  final String status;
  final String type;
  final double price;

  Machinery({
    required this.id,
    required this.name,
    required this.description,
    required this.brand,
    required this.coverImage,
    required this.status,
    required this.type,
    required this.price,
  });

  factory Machinery.fromJson(Map<String, dynamic> json) {
    return Machinery(
      id: json['id'] ?? json['_id']?.toString() ?? '',
      name: json['name'] ?? json['title'] ?? '',
      description: json['description'] ?? '',
      brand: json['brand'] ?? '',
      coverImage: json['coverImage'] ?? '',
      status: json['status'] ?? '',
      type: json['type'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
    );
  }
}
