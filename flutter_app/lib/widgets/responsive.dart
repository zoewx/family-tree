import 'package:flutter/material.dart';

/// Breakpoints for responsive layout
class Breakpoints {
  static const double phone = 600;
  static const double tablet = 900;
  static const double desktop = 1200;
}

/// Returns the number of grid columns based on screen width
int responsiveColumns(BuildContext context) {
  final width = MediaQuery.of(context).size.width;
  if (width >= Breakpoints.desktop) return 4;
  if (width >= Breakpoints.tablet) return 3;
  if (width >= Breakpoints.phone) return 2;
  return 1;
}

/// Returns true if the screen is at least tablet-width
bool isTablet(BuildContext context) =>
    MediaQuery.of(context).size.width >= Breakpoints.phone;

/// Returns true if the screen is at least desktop-width
bool isDesktop(BuildContext context) =>
    MediaQuery.of(context).size.width >= Breakpoints.desktop;

/// A widget that picks between [phone] and [tablet] layouts
class ResponsiveLayout extends StatelessWidget {
  final Widget phone;
  final Widget? tablet;

  const ResponsiveLayout({
    super.key,
    required this.phone,
    this.tablet,
  });

  @override
  Widget build(BuildContext context) {
    if (isTablet(context) && tablet != null) return tablet!;
    return phone;
  }
}

/// Constrains content width for large screens, centering it
class ContentConstraint extends StatelessWidget {
  final Widget child;
  final double maxWidth;

  const ContentConstraint({
    super.key,
    required this.child,
    this.maxWidth = 600,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: child,
      ),
    );
  }
}

/// A responsive grid that adjusts column count based on screen width
class ResponsiveGrid extends StatelessWidget {
  final List<Widget> children;
  final double spacing;
  final double runSpacing;
  final double childAspectRatio;

  const ResponsiveGrid({
    super.key,
    required this.children,
    this.spacing = 12,
    this.runSpacing = 12,
    this.childAspectRatio = 1.6,
  });

  @override
  Widget build(BuildContext context) {
    final cols = responsiveColumns(context);
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: cols,
        crossAxisSpacing: spacing,
        mainAxisSpacing: runSpacing,
        childAspectRatio: childAspectRatio,
      ),
      itemCount: children.length,
      itemBuilder: (_, i) => children[i],
    );
  }
}
