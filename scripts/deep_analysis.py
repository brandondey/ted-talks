#!/usr/bin/env python3
"""
Deep analysis to find non-obvious insights in TED talk openers.
Staff-level NLP data science for a scrutinizing audience.
"""

import pandas as pd
import numpy as np
from collections import Counter, defaultdict
import re
import json
import os
from scipy import stats
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

print("=" * 80)
print("DEEP ANALYSIS: TED TALK OPENERS")
print("=" * 80)

# Determine paths based on execution location
if os.path.exists("data/ted_talks_en.csv"):
    data_path = "data/ted_talks_en.csv"
    output_path = "outputs/insights_data.json"
else:
    data_path = "../data/ted_talks_en.csv"
    output_path = "../outputs/insights_data.json"

# Load data
df = pd.read_csv(data_path)
df['first_line'] = df['transcript'].apply(lambda txt: txt.split("\n")[0] if isinstance(txt, str) else "")
df['first_line_length'] = df['first_line'].apply(lambda x: len(str(x)))
df['first_line_word_count'] = df['first_line'].apply(lambda x: len(str(x).split()))
df['year'] = pd.to_datetime(df['published_date']).dt.year
df['views_per_year'] = df['views'] / (2025 - df['year'] + 1)  # Normalize by age

print(f"\n📊 Dataset: {len(df):,} talks from {df['year'].min()}-{df['year'].max()}")
print(f"📊 Total views: {df['views'].sum()/1e9:.2f}B")

# ============================================================================
# INSIGHT 1: The Poetry Infiltration
# ============================================================================
print("\n" + "=" * 80)
print("INSIGHT 1: TED Has Been Infiltrated By Poets (And Nobody Noticed)")
print("=" * 80)

def is_poetry_reading(row):
    """Detect if this is a poetry reading"""
    first_line = str(row['first_line']).lower()

    # Strong signals
    if any(phrase in first_line for phrase in ['this poem', 'called "', 'by william', 'by robert', 'by emma', 'by emily']):
        return True
    if first_line.count('"') >= 2 and len(first_line) > 100:
        return True

    return False

df['is_poetry'] = df.apply(is_poetry_reading, axis=1)
poetry_talks = df[df['is_poetry']]

print(f"\n🎭 Poetry readings: {len(poetry_talks)} out of {len(df)} ({len(poetry_talks)/len(df)*100:.1f}%)")
print(f"📊 Average views for poetry: {poetry_talks['views'].mean()/1e6:.2f}M")
print(f"📊 Average views for non-poetry: {df[~df['is_poetry']]['views'].mean()/1e6:.2f}M")

t_stat, p_value = stats.ttest_ind(poetry_talks['views'], df[~df['is_poetry']]['views'])
print(f"📊 T-test p-value: {p_value:.4f} {'(significant!)' if p_value < 0.05 else '(not significant)'}")

print("\n🎭 Example poetry readings:")
for idx, row in poetry_talks.head(10).iterrows():
    print(f"\n  • {row['speaker_1']}: \"{row['first_line'][:150]}...\"")
    print(f"    {row['views']:,} views | {row['event']}")

# ============================================================================
# INSIGHT 2: The Question Gambit
# ============================================================================
print("\n" + "=" * 80)
print("INSIGHT 2: Questions Don't Work The Way You Think")
print("=" * 80)

df['starts_with_question'] = df['first_line'].str.strip().str.endswith('?')
question_talks = df[df['starts_with_question']]
non_question_talks = df[~df['starts_with_question']]

print(f"\n❓ Question openers: {len(question_talks)} ({len(question_talks)/len(df)*100:.1f}%)")
print(f"📊 Median views (questions): {question_talks['views'].median()/1e6:.2f}M")
print(f"📊 Median views (non-questions): {non_question_talks['views'].median()/1e6:.2f}M")

# Mann-Whitney U test (non-parametric)
u_stat, p_value = stats.mannwhitneyu(question_talks['views'], non_question_talks['views'])
print(f"📊 Mann-Whitney U p-value: {p_value:.4f}")

# But let's look at WHICH questions work
print("\n❓ High-performing question openers (>5M views):")
high_view_questions = question_talks[question_talks['views'] > 5e6].sort_values('views', ascending=False)
for idx, row in high_view_questions.head(5).iterrows():
    print(f"\n  • {row['speaker_1']}: \"{row['first_line'][:120]}\"")
    print(f"    {row['views']/1e6:.1f}M views | {row['title']}")

print("\n❓ Low-performing question openers (<100K views):")
low_view_questions = question_talks[question_talks['views'] < 100000].sort_values('views')
for idx, row in low_view_questions.head(5).iterrows():
    print(f"\n  • {row['speaker_1']}: \"{row['first_line'][:120]}\"")
    print(f"    {row['views']:,} views | {row['title']}")

# ============================================================================
# INSIGHT 3: Personal Pronouns Over Time
# ============================================================================
print("\n" + "=" * 80)
print("INSIGHT 3: TED Speakers Are Getting More Personal (And More Self-Centered?)")
print("=" * 80)

df['starts_with_i'] = df['first_line'].str.lower().str.startswith('i ')
df['has_we'] = df['first_line'].str.lower().str.contains(r'\bwe\b')
df['has_you'] = df['first_line'].str.lower().str.contains(r'\byou\b')

yearly_pronouns = df.groupby('year').agg({
    'starts_with_i': 'mean',
    'has_we': 'mean',
    'has_you': 'mean',
    'first_line': 'count'
}).rename(columns={'first_line': 'count'})

# Only look at years with >20 talks
yearly_pronouns = yearly_pronouns[yearly_pronouns['count'] > 20]

print("\n📈 Pronoun usage evolution:")
print(f"  Early TED (2006-2010):")
early = df[(df['year'] >= 2006) & (df['year'] <= 2010)]
print(f"    'I' openers: {early['starts_with_i'].mean()*100:.1f}%")
print(f"    'We' mentions: {early['has_we'].mean()*100:.1f}%")
print(f"    'You' mentions: {early['has_you'].mean()*100:.1f}%")

print(f"\n  Recent TED (2020-2024):")
recent = df[df['year'] >= 2020]
print(f"    'I' openers: {recent['starts_with_i'].mean()*100:.1f}%")
print(f"    'We' mentions: {recent['has_we'].mean()*100:.1f}%")
print(f"    'You' mentions: {recent['has_you'].mean()*100:.1f}%")

# Chi-square test
from scipy.stats import chi2_contingency
contingency_table = pd.crosstab(df['year'] >= 2020, df['starts_with_i'])
chi2, p_value, dof, expected = chi2_contingency(contingency_table)
print(f"\n📊 Chi-square test for 'I' usage change: p={p_value:.4f}")

# ============================================================================
# INSIGHT 4: Occupation-Based Opening Styles
# ============================================================================
print("\n" + "=" * 80)
print("INSIGHT 4: Your Job Predicts How You'll Start Your Talk")
print("=" * 80)

def extract_occupation_category(occ_str):
    """Categorize occupations into broad groups"""
    if pd.isna(occ_str):
        return "Unknown"

    occ_str = str(occ_str).lower()

    if any(word in occ_str for word in ['artist', 'poet', 'photographer', 'designer', 'musician', 'filmmaker', 'dancer']):
        return "Artist"
    elif any(word in occ_str for word in ['scientist', 'researcher', 'biologist', 'physicist', 'chemist', 'neuroscientist']):
        return "Scientist"
    elif any(word in occ_str for word in ['writer', 'author', 'journalist', 'storyteller']):
        return "Writer"
    elif any(word in occ_str for word in ['entrepreneur', 'ceo', 'founder', 'business']):
        return "Entrepreneur"
    elif any(word in occ_str for word in ['activist', 'advocate', 'organizer']):
        return "Activist"
    elif any(word in occ_str for word in ['psychologist', 'psychiatrist', 'therapist']):
        return "Psychologist"
    else:
        return "Other"

df['occupation_category'] = df['occupations'].apply(extract_occupation_category)

print("\n👔 Opening strategies by occupation:")
for occ in ['Artist', 'Scientist', 'Writer', 'Entrepreneur', 'Activist', 'Psychologist']:
    occ_df = df[df['occupation_category'] == occ]
    if len(occ_df) < 10:
        continue

    print(f"\n  {occ} (n={len(occ_df)}):")
    print(f"    Starts with 'I': {occ_df['starts_with_i'].mean()*100:.1f}%")
    print(f"    Question opener: {occ_df['starts_with_question'].mean()*100:.1f}%")
    print(f"    Avg word count: {occ_df['first_line_word_count'].mean():.1f}")
    print(f"    Median views: {occ_df['views'].median()/1e6:.2f}M")

# ============================================================================
# INSIGHT 5: The Length Extremes
# ============================================================================
print("\n" + "=" * 80)
print("INSIGHT 5: The Extremes Tell The Story")
print("=" * 80)

print("\n📏 Shortest openers (<10 characters):")
shortest = df[df['first_line_length'] < 10].sort_values('views', ascending=False)
for idx, row in shortest.head(5).iterrows():
    print(f"\n  • \"{row['first_line']}\"")
    print(f"    {row['speaker_1']} | {row['views']/1e6:.1f}M views | {row['title'][:60]}")

print("\n📏 Longest openers (>500 characters):")
longest = df[df['first_line_length'] > 500].sort_values('first_line_length', ascending=False)
for idx, row in longest.head(5).iterrows():
    print(f"\n  • {row['first_line'][:200]}...")
    print(f"    {row['speaker_1']} | {row['views']/1e6:.1f}M views | {row['title'][:60]}")
    print(f"    Length: {row['first_line_length']} chars")

# ============================================================================
# INSIGHT 6: The Viral Formula (or lack thereof)
# ============================================================================
print("\n" + "=" * 80)
print("INSIGHT 6: What Makes A Talk Go Viral? (It's Not The Opener)")
print("=" * 80)

# Define viral as top 1%
viral_threshold = df['views'].quantile(0.99)
df['is_viral'] = df['views'] > viral_threshold

viral_talks = df[df['is_viral']]
non_viral = df[~df['is_viral']]

print(f"\n🚀 Viral talks (top 1%): {len(viral_talks)} talks with >{viral_threshold/1e6:.1f}M views")
print(f"\n📊 Opener characteristics:")
print(f"  Length - Viral: {viral_talks['first_line_word_count'].mean():.1f} words")
print(f"  Length - Non-viral: {non_viral['first_line_word_count'].mean():.1f} words")
print(f"  Starts with 'I' - Viral: {viral_talks['starts_with_i'].mean()*100:.1f}%")
print(f"  Starts with 'I' - Non-viral: {non_viral['starts_with_i'].mean()*100:.1f}%")
print(f"  Question - Viral: {viral_talks['starts_with_question'].mean()*100:.1f}%")
print(f"  Question - Non-viral: {non_viral['starts_with_question'].mean()*100:.1f}%")

print("\n🚀 Most viral openers:")
for idx, row in viral_talks.nlargest(10, 'views').iterrows():
    print(f"\n  • \"{row['first_line'][:120]}...\"")
    print(f"    {row['speaker_1']} | {row['views']/1e6:.1f}M views")
    print(f"    {row['title']}")

# ============================================================================
# INSIGHT 7: Words That Predict Success
# ============================================================================
print("\n" + "=" * 80)
print("INSIGHT 7: Words That Correlate With Views")
print("=" * 80)

from sklearn.feature_extraction.text import CountVectorizer

# Vectorize opening lines
vectorizer = CountVectorizer(max_features=100, stop_words='english', min_df=10)
X = vectorizer.fit_transform(df['first_line'].fillna(''))
feature_names = vectorizer.get_feature_names_out()

# Calculate correlation between each word and views
word_correlations = {}
for i, word in enumerate(feature_names):
    word_presence = X[:, i].toarray().flatten()
    if word_presence.sum() > 0:
        corr, p_value = stats.spearmanr(word_presence, df['views'])
        if not np.isnan(corr):
            word_correlations[word] = {'corr': corr, 'p_value': p_value, 'count': int(word_presence.sum())}

# Sort by correlation
sorted_words = sorted(word_correlations.items(), key=lambda x: x[1]['corr'], reverse=True)

print("\n📈 Words that correlate with MORE views:")
for word, stats_dict in sorted_words[:10]:
    if stats_dict['p_value'] < 0.05:
        print(f"  • '{word}': r={stats_dict['corr']:.3f}, p={stats_dict['p_value']:.4f}, n={stats_dict['count']}")

print("\n📉 Words that correlate with FEWER views:")
for word, stats_dict in sorted_words[-10:]:
    if stats_dict['p_value'] < 0.05:
        print(f"  • '{word}': r={stats_dict['corr']:.3f}, p={stats_dict['p_value']:.4f}, n={stats_dict['count']}")

# ============================================================================
# INSIGHT 8: The Event Effect
# ============================================================================
print("\n" + "=" * 80)
print("INSIGHT 8: Main Stage vs Side Stages")
print("=" * 80)

df['event_type'] = df['event'].apply(lambda x: 'Main' if 'TED2' in str(x) or str(x) == 'TED' else 'TEDx/Other')

print("\n🎪 Event comparison:")
for event_type in ['Main', 'TEDx/Other']:
    event_df = df[df['event_type'] == event_type]
    print(f"\n  {event_type} (n={len(event_df)}):")
    print(f"    Avg opener length: {event_df['first_line_word_count'].mean():.1f} words")
    print(f"    Starts with 'I': {event_df['starts_with_i'].mean()*100:.1f}%")
    print(f"    Question: {event_df['starts_with_question'].mean()*100:.1f}%")
    print(f"    Median views: {event_df['views'].median()/1e6:.2f}M")

# ============================================================================
# Save findings for visualization
# ============================================================================
print("\n" + "=" * 80)
print("SAVING INSIGHTS DATA")
print("=" * 80)

insights_data = {
    'poetry_readings': poetry_talks[['title', 'speaker_1', 'first_line', 'views', 'url']].to_dict('records'),
    'viral_talks': viral_talks.nlargest(20, 'views')[['title', 'speaker_1', 'first_line', 'views', 'url', 'year']].to_dict('records'),
    'shortest_openers': shortest.head(10).to_dict('records'),
    'longest_openers': longest.head(10).to_dict('records'),
    'high_view_questions': high_view_questions.head(10).to_dict('records'),
    'low_view_questions': low_view_questions.head(10).to_dict('records'),
    'word_correlations': {
        'positive': [(w, d['corr'], d['count']) for w, d in sorted_words[:15] if d['p_value'] < 0.05],
        'negative': [(w, d['corr'], d['count']) for w, d in sorted_words[-15:] if d['p_value'] < 0.05]
    },
    'stats': {
        'total_talks': len(df),
        'poetry_count': len(poetry_talks),
        'viral_threshold': float(viral_threshold),
        'year_range': [int(df['year'].min()), int(df['year'].max())],
        'total_views': float(df['views'].sum())
    }
}

# Save for the visualization script
os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
with open(output_path, 'w') as f:
    json.dump(insights_data, f, indent=2)

print(f"\n✅ Saved {output_path}")
print("\n" + "=" * 80)
print("ANALYSIS COMPLETE")
print("=" * 80)
