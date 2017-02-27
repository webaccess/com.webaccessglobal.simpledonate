{*
 +--------------------------------------------------------------------+
 | CiviCRM version 4.7                                                |
 +--------------------------------------------------------------------+
 | Copyright CiviCRM LLC (c) 2004-2014                                |
 +--------------------------------------------------------------------+
 | This file is a part of CiviCRM.                                    |
 |                                                                    |
 | CiviCRM is free software; you can copy, modify, and distribute it  |
 | under the terms of the GNU Affero General Public License           |
 | Version 3, 19 November 2007 and the CiviCRM Licensing Exception.   |
 |                                                                    |
 | CiviCRM is distributed in the hope that it will be useful, but     |
 | WITHOUT ANY WARRANTY; without even the implied warranty of         |
 | MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.               |
 | See the GNU Affero General Public License for more details.        |
 |                                                                    |
 | You should have received a copy of the GNU Affero General Public   |
 | License and the CiviCRM Licensing Exception along                  |
 | with this program; if not, contact CiviCRM LLC                     |
 | at info[AT]civicrm[DOT]org. If you have questions about the        |
 | GNU Affero General Public License or the licensing of CiviCRM,     |
 | see the CiviCRM license FAQ at http://civicrm.org/licensing        |
 +--------------------------------------------------------------------+
*}

{if $rows}
  <div id="configure_contribution_page">
    {strip}
    <table class="display">
      <thead>
        <tr>
          <th>{ts}ID{/ts}</th>
          <th>{ts}Title{/ts}</th>
          <th></th>
        </tr>
      </thead>
      {foreach from=$rows item=row}
        <tr id="contribution_page-{$row.id}">
          <td>{$row.id}</td>
          <td><strong>{$row.title}</strong></td>
          <td>
            {$row.action|replace:'xx':$row.id}
          </td>
        </tr>
      {/foreach}
    </table>
    {/strip}
  </div>
{else}
  {ts}No contribution pages have been selected for Simple Donation.{/ts}
{/if}
