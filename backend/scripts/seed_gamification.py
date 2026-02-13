"""
Seed script to initialize gamification data (challenges, achievements, rewards)
Run this script to populate the database with initial data.
"""
import os
import sys
from datetime import datetime, timezone, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.database import (
    challenges_collection, achievements_collection, 
    rewards_collection, seasons_collection
)

def seed_challenges():
    """Seed challenges collection"""
    challenges = [
        # Daily Challenges
        {
            "_id": "ch_daily_1",
            "title": "Premier Trade du Jour",
            "description": "Enregistre ton premier trade de la journée",
            "type": "daily",
            "target": 1,
            "xp_reward": 50,
            "duration_days": 1,
            "difficulty": "easy",
            "active": True
        },
        {
            "_id": "ch_daily_2",
            "title": "Journal Complet",
            "description": "Remplis les notes et émotions sur 3 trades",
            "type": "daily",
            "target": 3,
            "xp_reward": 75,
            "duration_days": 1,
            "difficulty": "medium",
            "active": True
        },
        {
            "_id": "ch_daily_3",
            "title": "Analyse Matinale",
            "description": "Consulte ton briefing quotidien avant 10h",
            "type": "daily",
            "target": 1,
            "xp_reward": 30,
            "duration_days": 1,
            "difficulty": "easy",
            "active": True
        },
        # Weekly Challenges
        {
            "_id": "ch_weekly_1",
            "title": "Trader Actif",
            "description": "Enregistre 10 trades cette semaine",
            "type": "weekly",
            "target": 10,
            "xp_reward": 200,
            "duration_days": 7,
            "difficulty": "medium",
            "active": True
        },
        {
            "_id": "ch_weekly_2",
            "title": "Discipline de Fer",
            "description": "Respecte ton plan sur 5 trades consécutifs",
            "type": "weekly",
            "target": 5,
            "xp_reward": 300,
            "duration_days": 7,
            "difficulty": "hard",
            "active": True
        },
        {
            "_id": "ch_weekly_3",
            "title": "Analyste Technique",
            "description": "Fais analyser 3 setups par l'IA",
            "type": "weekly",
            "target": 3,
            "xp_reward": 150,
            "duration_days": 7,
            "difficulty": "medium",
            "active": True
        },
        {
            "_id": "ch_weekly_4",
            "title": "Communauté Active",
            "description": "Publie 2 posts dans la communauté",
            "type": "weekly",
            "target": 2,
            "xp_reward": 100,
            "duration_days": 7,
            "difficulty": "easy",
            "active": True
        },
        # Monthly Challenges
        {
            "_id": "ch_monthly_1",
            "title": "Maître du Journal",
            "description": "Enregistre 50 trades ce mois",
            "type": "monthly",
            "target": 50,
            "xp_reward": 500,
            "duration_days": 30,
            "difficulty": "hard",
            "active": True
        },
        {
            "_id": "ch_monthly_2",
            "title": "Winrate Positif",
            "description": "Atteins un winrate de 55% sur 20 trades minimum",
            "type": "monthly",
            "target": 55,
            "xp_reward": 750,
            "duration_days": 30,
            "difficulty": "hard",
            "active": True
        },
        {
            "_id": "ch_monthly_3",
            "title": "Stratège",
            "description": "Complète 2 backtests avec l'IA",
            "type": "monthly",
            "target": 2,
            "xp_reward": 400,
            "duration_days": 30,
            "difficulty": "medium",
            "active": True
        },
        {
            "_id": "ch_monthly_4",
            "title": "Série Gagnante",
            "description": "Maintiens une série de 7 jours d'activité",
            "type": "monthly",
            "target": 7,
            "xp_reward": 350,
            "duration_days": 30,
            "difficulty": "medium",
            "active": True
        }
    ]
    
    # Clear and insert
    challenges_collection.delete_many({})
    challenges_collection.insert_many(challenges)
    print(f"✅ {len(challenges)} challenges créés")

def seed_achievements():
    """Seed achievements/badges collection"""
    achievements = [
        # Trading Milestones
        {
            "_id": "ach_first_trade",
            "title": "Premier Pas",
            "description": "Enregistre ton premier trade",
            "icon": "rocket",
            "xp_reward": 100,
            "rarity": "common",
            "category": "trading"
        },
        {
            "_id": "ach_10_trades",
            "title": "Trader Junior",
            "description": "Atteins 10 trades enregistrés",
            "icon": "chart-line",
            "xp_reward": 200,
            "rarity": "common",
            "category": "trading"
        },
        {
            "_id": "ach_50_trades",
            "title": "Trader Confirmé",
            "description": "Atteins 50 trades enregistrés",
            "icon": "chart-bar",
            "xp_reward": 500,
            "rarity": "uncommon",
            "category": "trading"
        },
        {
            "_id": "ach_100_trades",
            "title": "Trader Expert",
            "description": "Atteins 100 trades enregistrés",
            "icon": "crown",
            "xp_reward": 1000,
            "rarity": "rare",
            "category": "trading"
        },
        {
            "_id": "ach_500_trades",
            "title": "Légende du Trading",
            "description": "Atteins 500 trades enregistrés",
            "icon": "gem",
            "xp_reward": 2500,
            "rarity": "legendary",
            "category": "trading"
        },
        # Winrate Achievements
        {
            "_id": "ach_winrate_50",
            "title": "Équilibriste",
            "description": "Atteins 50% de winrate sur 20+ trades",
            "icon": "balance-scale",
            "xp_reward": 300,
            "rarity": "common",
            "category": "performance"
        },
        {
            "_id": "ach_winrate_60",
            "title": "Gagnant",
            "description": "Atteins 60% de winrate sur 50+ trades",
            "icon": "trophy",
            "xp_reward": 750,
            "rarity": "uncommon",
            "category": "performance"
        },
        {
            "_id": "ach_winrate_70",
            "title": "Sniper",
            "description": "Atteins 70% de winrate sur 100+ trades",
            "icon": "crosshairs",
            "xp_reward": 1500,
            "rarity": "rare",
            "category": "performance"
        },
        # Streak Achievements
        {
            "_id": "ach_streak_3",
            "title": "Régulier",
            "description": "3 jours d'activité consécutifs",
            "icon": "fire",
            "xp_reward": 100,
            "rarity": "common",
            "category": "engagement"
        },
        {
            "_id": "ach_streak_7",
            "title": "Assidu",
            "description": "7 jours d'activité consécutifs",
            "icon": "fire-alt",
            "xp_reward": 300,
            "rarity": "uncommon",
            "category": "engagement"
        },
        {
            "_id": "ach_streak_30",
            "title": "Infaillible",
            "description": "30 jours d'activité consécutifs",
            "icon": "medal",
            "xp_reward": 1000,
            "rarity": "rare",
            "category": "engagement"
        },
        # AI Features
        {
            "_id": "ach_first_analysis",
            "title": "Analyste IA",
            "description": "Fais ta première analyse de setup par l'IA",
            "icon": "brain",
            "xp_reward": 150,
            "rarity": "common",
            "category": "ai"
        },
        {
            "_id": "ach_first_coaching",
            "title": "Coaché",
            "description": "Reçois ton premier coaching IA",
            "icon": "user-graduate",
            "xp_reward": 150,
            "rarity": "common",
            "category": "ai"
        },
        {
            "_id": "ach_first_backtest",
            "title": "Stratège",
            "description": "Complète ton premier backtest",
            "icon": "flask",
            "xp_reward": 200,
            "rarity": "common",
            "category": "ai"
        },
        {
            "_id": "ach_10_backtests",
            "title": "Scientifique du Trading",
            "description": "Complète 10 backtests",
            "icon": "microscope",
            "xp_reward": 750,
            "rarity": "uncommon",
            "category": "ai"
        },
        # Community
        {
            "_id": "ach_first_post",
            "title": "Social Trader",
            "description": "Publie ton premier post",
            "icon": "comments",
            "xp_reward": 100,
            "rarity": "common",
            "category": "community"
        },
        {
            "_id": "ach_10_likes",
            "title": "Influenceur",
            "description": "Reçois 10 likes sur tes posts",
            "icon": "heart",
            "xp_reward": 300,
            "rarity": "uncommon",
            "category": "community"
        },
        {
            "_id": "ach_helpful",
            "title": "Mentor",
            "description": "Aide 5 traders avec tes commentaires",
            "icon": "hands-helping",
            "xp_reward": 400,
            "rarity": "uncommon",
            "category": "community"
        },
        # Special
        {
            "_id": "ach_early_adopter",
            "title": "Early Adopter",
            "description": "Rejoins la plateforme pendant la phase beta",
            "icon": "star",
            "xp_reward": 500,
            "rarity": "rare",
            "category": "special"
        },
        {
            "_id": "ach_profitable_month",
            "title": "Mois Vert",
            "description": "Termine un mois avec un PnL positif",
            "icon": "dollar-sign",
            "xp_reward": 500,
            "rarity": "uncommon",
            "category": "performance"
        },
        {
            "_id": "ach_leaderboard_top10",
            "title": "Top 10",
            "description": "Atteins le top 10 du leaderboard",
            "icon": "award",
            "xp_reward": 1000,
            "rarity": "rare",
            "category": "competition"
        }
    ]
    
    # Clear and insert
    achievements_collection.delete_many({})
    achievements_collection.insert_many(achievements)
    print(f"✅ {len(achievements)} badges/achievements créés")

def seed_rewards():
    """Seed rewards collection"""
    rewards = [
        # Level-based rewards
        {
            "_id": "rwd_theme_dark_blue",
            "title": "Thème Blue Ocean",
            "description": "Thème sombre avec accents bleus",
            "type": "theme",
            "required_level": 1,
            "value": "dark-blue"
        },
        {
            "_id": "rwd_theme_green",
            "title": "Thème Green Bull",
            "description": "Thème inspiré des marchés haussiers",
            "type": "theme",
            "required_level": 3,
            "value": "green-bull"
        },
        {
            "_id": "rwd_theme_gold",
            "title": "Thème Gold Premium",
            "description": "Thème doré exclusif",
            "type": "theme",
            "required_level": 5,
            "value": "gold-premium"
        },
        {
            "_id": "rwd_theme_neon",
            "title": "Thème Neon Trader",
            "description": "Thème cyberpunk avec effets néon",
            "type": "theme",
            "required_level": 10,
            "value": "neon-trader"
        },
        {
            "_id": "rwd_theme_elite",
            "title": "Thème Elite Black",
            "description": "Thème noir élégant réservé aux experts",
            "type": "theme",
            "required_level": 15,
            "value": "elite-black"
        },
        # Feature unlocks
        {
            "_id": "rwd_feature_advanced_stats",
            "title": "Stats Avancées",
            "description": "Débloque les statistiques détaillées",
            "type": "feature",
            "required_level": 2,
            "value": "advanced_stats"
        },
        {
            "_id": "rwd_feature_ai_unlimited",
            "title": "IA Illimitée",
            "description": "Analyses IA illimitées pendant 7 jours",
            "type": "feature",
            "required_level": 5,
            "value": "ai_unlimited_7d"
        },
        {
            "_id": "rwd_feature_export",
            "title": "Export Premium",
            "description": "Export PDF avec graphiques détaillés",
            "type": "feature",
            "required_level": 7,
            "value": "premium_export"
        },
        {
            "_id": "rwd_feature_priority_support",
            "title": "Support Prioritaire",
            "description": "Accès au support prioritaire",
            "type": "feature",
            "required_level": 10,
            "value": "priority_support"
        },
        # Badges/Titles
        {
            "_id": "rwd_title_apprentice",
            "title": "Titre: Apprenti",
            "description": "Affiche le titre 'Apprenti Trader'",
            "type": "title",
            "required_level": 2,
            "value": "Apprenti Trader"
        },
        {
            "_id": "rwd_title_trader",
            "title": "Titre: Trader",
            "description": "Affiche le titre 'Trader'",
            "type": "title",
            "required_level": 5,
            "value": "Trader"
        },
        {
            "_id": "rwd_title_pro",
            "title": "Titre: Pro Trader",
            "description": "Affiche le titre 'Pro Trader'",
            "type": "title",
            "required_level": 10,
            "value": "Pro Trader"
        },
        {
            "_id": "rwd_title_master",
            "title": "Titre: Master Trader",
            "description": "Affiche le titre 'Master Trader'",
            "type": "title",
            "required_level": 20,
            "value": "Master Trader"
        },
        {
            "_id": "rwd_title_legend",
            "title": "Titre: Légende",
            "description": "Affiche le titre 'Légende du Trading'",
            "type": "title",
            "required_level": 50,
            "value": "Légende du Trading"
        },
        # Exclusive content
        {
            "_id": "rwd_webinar_access",
            "title": "Accès Webinaires",
            "description": "Accès aux webinaires exclusifs",
            "type": "content",
            "required_level": 8,
            "value": "webinar_access"
        },
        {
            "_id": "rwd_mentoring_session",
            "title": "Session Mentoring",
            "description": "Une session de mentoring privée",
            "type": "content",
            "required_level": 15,
            "value": "mentoring_session"
        }
    ]
    
    # Clear and insert
    rewards_collection.delete_many({})
    rewards_collection.insert_many(rewards)
    print(f"✅ {len(rewards)} récompenses créées")

def seed_seasons():
    """Seed current season"""
    now = datetime.now(timezone.utc)
    season_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Get next month for end date
    if now.month == 12:
        season_end = season_start.replace(year=now.year + 1, month=1)
    else:
        season_end = season_start.replace(month=now.month + 1)
    
    season = {
        "_id": "season_2026_02",
        "name": "Saison Février 2026",
        "start_date": season_start.isoformat(),
        "end_date": season_end.isoformat(),
        "active": True,
        "rewards": [
            {"rank": 1, "title": "Champion de la Saison", "xp_bonus": 5000, "badge": "season_champion"},
            {"rank": 2, "title": "Vice-Champion", "xp_bonus": 3000, "badge": "season_silver"},
            {"rank": 3, "title": "Médaille de Bronze", "xp_bonus": 2000, "badge": "season_bronze"},
            {"rank_range": [4, 10], "title": "Top 10", "xp_bonus": 1000, "badge": "season_top10"},
            {"rank_range": [11, 50], "title": "Top 50", "xp_bonus": 500, "badge": "season_top50"}
        ]
    }
    
    # Clear and insert
    seasons_collection.delete_many({})
    seasons_collection.insert_one(season)
    print(f"✅ Saison active créée: {season['name']}")

def main():
    print("\n🚀 Initialisation des données de gamification...\n")
    
    seed_challenges()
    seed_achievements()
    seed_rewards()
    seed_seasons()
    
    print("\n✅ Toutes les données ont été initialisées avec succès!")
    print("\n📊 Résumé:")
    print(f"   - Challenges: {challenges_collection.count_documents({})}")
    print(f"   - Achievements: {achievements_collection.count_documents({})}")
    print(f"   - Rewards: {rewards_collection.count_documents({})}")
    print(f"   - Seasons: {seasons_collection.count_documents({})}")

if __name__ == "__main__":
    main()
