export interface PoolTier {
  days: number;
  discountPercent: number;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  badge: string;
  badgeFr: string;
  carbonReductionPercent: number;
  matchedSitesEstimate: number;
}

export function getPoolTier(days: number): PoolTier {
  if (days <= 1) {
    return {
      days,
      discountPercent: 0,
      name: 'Exact Date (Express Direct)',
      nameFr: 'Date Fixe (Express Direct)',
      description: 'Guaranteed priority slot on the exact selected day.',
      descriptionFr: 'Créneau prioritaire garanti à la date exacte sélectionnée.',
      badge: 'Direct Pour',
      badgeFr: 'Coulage Direct',
      carbonReductionPercent: 0,
      matchedSitesEstimate: 0,
    };
  } else if (days <= 7) {
    return {
      days,
      discountPercent: 8,
      name: 'Local Route (1-7 Days)',
      nameFr: 'Tournée Locale (1 à 7 Jours)',
      description: 'Batched with 1-2 nearby projects in your municipality.',
      descriptionFr: 'Groupé avec 1 à 2 chantiers proches dans votre commune.',
      badge: 'Save 8%',
      badgeFr: '-8% Réduction',
      carbonReductionPercent: 12,
      matchedSitesEstimate: 2,
    };
  } else if (days <= 21) {
    return {
      days,
      discountPercent: 15,
      name: 'Smart Pool (8-21 Days)',
      nameFr: 'Smart Pool (8 à 21 Jours)',
      description: 'Uber-Pool for concrete: Shared mixer trucks and eliminated short-load surcharges.',
      descriptionFr: 'Groupage intelligent : toupies mutualisées et suppression des frais de sous-charge.',
      badge: 'Save 15%',
      badgeFr: '-15% Réduction',
      carbonReductionPercent: 24,
      matchedSitesEstimate: 4,
    };
  } else if (days <= 45) {
    return {
      days,
      discountPercent: 22,
      name: 'Eco-Batch (22-45 Days)',
      nameFr: 'Éco-Chantier Partagé (22 à 45 Jours)',
      description: 'Scheduled with recurring civil & residential neighborhood pours.',
      descriptionFr: 'Planifié sur les grandes tournées régulières de la centrale dans votre secteur.',
      badge: 'Save 22%',
      badgeFr: '-22% Réduction',
      carbonReductionPercent: 35,
      matchedSitesEstimate: 7,
    };
  } else {
    return {
      days,
      discountPercent: 30,
      name: 'Max Pool Share (46-90 Days)',
      nameFr: 'Max Pool Mutualisé (46 à 90 Jours)',
      description: 'Maximum savings: Joined into major infrastructure batch runs nearby.',
      descriptionFr: 'Économie maximale : mutualisé avec les grands coulage de voirie et gros œuvre voisins.',
      badge: 'Save 30%',
      badgeFr: '-30% Économie Max',
      carbonReductionPercent: 48,
      matchedSitesEstimate: 12,
    };
  }
}
